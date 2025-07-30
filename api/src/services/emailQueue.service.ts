// api/src/services/emailQueue.service.ts
import Bull from 'bull';
import Redis from 'ioredis';
import { emailService } from './email.service';
import { Campaign } from '../models/Campaign.model';
import { Contact } from '../models/Contact.model';
import { EmailTracking } from '../models/EmailTracking.model';
import { logger } from '../utils/logger';

interface EmailJob {
  campaignId: string;
  contactId: string;
  email: string;
  personalizedContent: {
    subject: string;
    htmlContent: string;
    textContent?: string;
  };
  trackingId: string;
}

interface CampaignJob {
  campaignId: string;
  userId: string;
}

class EmailQueueService {
  private redis: Redis;
  private emailQueue: Bull.Queue<EmailJob>;
  private campaignQueue: Bull.Queue<CampaignJob>;

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    // Initialize email sending queue
    this.emailQueue = new Bull<EmailJob>('email-sending', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50,      // Keep last 50 failed jobs
        attempts: 3,           // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 30000,        // Start with 30 second delay
        },
      },
    });

    // Initialize campaign processing queue
    this.campaignQueue = new Bull<CampaignJob>('campaign-processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 10,
        attempts: 2,
      },
    });

    this.setupEmailQueueProcessor();
    this.setupCampaignQueueProcessor();
    this.setupQueueEvents();
  }

  private setupEmailQueueProcessor() {
    // Process individual email sending with rate limiting
    this.emailQueue.process('send-email', 5, async (job) => {
      const { campaignId, contactId, email, personalizedContent, trackingId } = job.data;
      
      try {
        // Check rate limiting
        await this.checkRateLimit();

        // Add tracking parameters to content
        const htmlWithTracking = this.addTrackingPixels(
          personalizedContent.htmlContent,
          trackingId
        );

        // Send email via email service
        const result = await emailService.sendEmail({
          to: email,
          subject: personalizedContent.subject,
          html: htmlWithTracking,
          text: personalizedContent.textContent,
        });

        // Update tracking record
        await EmailTracking.findByIdAndUpdate(trackingId, {
          status: 'sent',
          sentAt: new Date(),
          messageId: result.messageId,
        });

        // Update campaign metrics
        await this.updateCampaignMetrics(campaignId, 'sent');

        logger.info(`Email sent successfully`, {
          campaignId,
          contactId,
          email,
          messageId: result.messageId,
        });

        return { success: true, messageId: result.messageId };
      } catch (error) {
        logger.error(`Email sending failed`, {
          campaignId,
          contactId,
          email,
          error: error.message,
        });

        // Update tracking record with error
        await EmailTracking.findByIdAndUpdate(trackingId, {
          status: 'failed',
          error: error.message,
        });

        // Update campaign metrics
        await this.updateCampaignMetrics(campaignId, 'bounces');

        throw error;
      }
    });
  }

  private setupCampaignQueueProcessor() {
    // Process campaign sending by batching contacts
    this.campaignQueue.process('process-campaign', 1, async (job) => {
      const { campaignId, userId } = job.data;
      
      try {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
          throw new Error('Campaign not found');
        }

        // Update campaign status
        campaign.status = 'sending';
        await campaign.save();

        // Get all contacts for this campaign
        let contacts;
        if (campaign.audienceType === 'segment') {
          contacts = await Contact.find({
            userId,
            segments: { $in: campaign.segments },
            subscribed: true,
          });
        } else if (campaign.audienceType === 'landivo') {
          // Get contacts from Landivo integration
          contacts = await this.getLandivoContacts(campaign.landivoEmailLists);
        } else {
          // All contacts
          contacts = await Contact.find({ userId, subscribed: true });
        }

        logger.info(`Processing campaign ${campaignId} for ${contacts.length} contacts`);

        // Create email jobs for each contact
        const emailJobs = [];
        for (const contact of contacts) {
          const trackingId = await this.createTrackingRecord(campaignId, contact._id);
          
          const personalizedContent = await this.personalizeContent(
            campaign,
            contact
          );

          emailJobs.push({
            campaignId,
            contactId: contact._id.toString(),
            email: contact.email,
            personalizedContent,
            trackingId,
          });
        }

        // Add all email jobs to queue with delay to respect rate limits
        for (let i = 0; i < emailJobs.length; i++) {
          await this.emailQueue.add('send-email', emailJobs[i], {
            delay: i * 1000, // 1 second delay between emails
          });
        }

        // Update campaign with initial metrics
        campaign.metrics.totalRecipients = contacts.length;
        await campaign.save();

        logger.info(`Campaign ${campaignId} queued successfully`, {
          totalEmails: contacts.length,
        });

        return { success: true, totalEmails: contacts.length };
      } catch (error) {
        logger.error(`Campaign processing failed`, {
          campaignId,
          error: error.message,
        });

        // Update campaign status to failed
        await Campaign.findByIdAndUpdate(campaignId, {
          status: 'failed',
          error: error.message,
        });

        throw error;
      }
    });
  }

  private setupQueueEvents() {
    this.emailQueue.on('completed', (job, result) => {
      logger.info(`Email job completed: ${job.id}`, result);
    });

    this.emailQueue.on('failed', (job, err) => {
      logger.error(`Email job failed: ${job.id}`, err);
    });

    this.campaignQueue.on('completed', (job, result) => {
      logger.info(`Campaign job completed: ${job.id}`, result);
    });

    this.campaignQueue.on('failed', (job, err) => {
      logger.error(`Campaign job failed: ${job.id}`, err);
    });
  }

  private async checkRateLimit(): Promise<void> {
    const key = 'email_rate_limit';
    const limit = 100; // 100 emails per hour
    const window = 3600; // 1 hour in seconds

    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, window);
    }

    if (current > limit) {
      throw new Error('Rate limit exceeded');
    }
  }

  private addTrackingPixels(htmlContent: string, trackingId: string): string {
    const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_SERVER_URL}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
    
    // Add tracking pixel before closing body tag
    return htmlContent.replace('</body>', `${trackingPixel}</body>`);
  }

  private async createTrackingRecord(campaignId: string, contactId: string): Promise<string> {
    const tracking = new EmailTracking({
      campaignId,
      contactId,
      status: 'queued',
      createdAt: new Date(),
    });
    
    await tracking.save();
    return tracking._id.toString();
  }

  private async personalizeContent(campaign: any, contact: any) {
    let subject = campaign.subject;
    let htmlContent = campaign.htmlContent;
    let textContent = campaign.textContent;

    // Basic personalization
    const replacements = {
      '{{firstName}}': contact.firstName || 'Friend',
      '{{lastName}}': contact.lastName || '',
      '{{email}}': contact.email,
      '{{companyName}}': contact.companyName || '',
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
      if (textContent) {
        textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
      }
    }

    return { subject, htmlContent, textContent };
  }

  private async getLandivoContacts(emailListIds: string[]) {
    // Implement Landivo API integration to get contacts
    // This would call your Landivo service to get contacts from specific lists
    const contacts = [];
    
    for (const listId of emailListIds) {
      try {
        // Replace with actual Landivo API call
        const listContacts = await this.fetchLandivoList(listId);
        contacts.push(...listContacts);
      } catch (error) {
        logger.error(`Failed to fetch Landivo list ${listId}:`, error);
      }
    }

    return contacts;
  }

  private async fetchLandivoList(listId: string) {
    // Implement actual Landivo API integration
    // For now, return empty array
    return [];
  }

  private async updateCampaignMetrics(campaignId: string, metric: string) {
    const updateQuery = {};
    updateQuery[`metrics.${metric}`] = 1;

    await Campaign.findByIdAndUpdate(
      campaignId,
      { $inc: updateQuery },
      { new: true }
    );
  }

  // Public methods for campaign management
  async sendCampaign(campaignId: string, userId: string): Promise<void> {
    await this.campaignQueue.add('process-campaign', {
      campaignId,
      userId,
    });
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    // Remove all pending email jobs for this campaign
    const jobs = await this.emailQueue.getJobs(['waiting', 'delayed']);
    const campaignJobs = jobs.filter(job => job.data.campaignId === campaignId);
    
    for (const job of campaignJobs) {
      await job.remove();
    }

    // Update campaign status
    await Campaign.findByIdAndUpdate(campaignId, {
      status: 'paused',
    });
  }

  async getQueueStats() {
    const emailWaiting = await this.emailQueue.getWaiting();
    const emailActive = await this.emailQueue.getActive();
    const campaignWaiting = await this.campaignQueue.getWaiting();
    const campaignActive = await this.campaignQueue.getActive();

    return {
      emailQueue: {
        waiting: emailWaiting.length,
        active: emailActive.length,
      },
      campaignQueue: {
        waiting: campaignWaiting.length,
        active: campaignActive.length,
      },
    };
  }
}

export const emailQueueService = new EmailQueueService();