// api/src/services/emailQueue.service.ts
import Bull from 'bull';
import Redis from 'ioredis';
import { emailService } from './email.service';
import { landivoService } from './landivo.service';
import { Campaign } from '../models/Campaign';
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
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Initialize email sending queue
    this.emailQueue = new Bull<EmailJob>('email-sending', {
      redis: {
        port: parseInt(process.env.REDIS_PORT || '6379'),
        host: process.env.REDIS_HOST || 'localhost',
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000,
        },
      },
    });

    // Initialize campaign processing queue
    this.campaignQueue = new Bull<CampaignJob>('campaign-processing', {
      redis: {
        port: parseInt(process.env.REDIS_PORT || '6379'),
        host: process.env.REDIS_HOST || 'localhost',
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 10,
        attempts: 2,
      },
    });

    this.setupProcessors();
    this.setupEventHandlers();
  }

  private setupProcessors() {
    // Process individual emails
    this.emailQueue.process('send-email', 3, async (job) => {
      const { campaignId, contactId, email, personalizedContent, trackingId } = job.data;
      
      try {
        // Check rate limiting
        await this.checkRateLimit();

        // Add tracking pixels to content
        const htmlWithTracking = await emailService.addTrackingPixel(
          personalizedContent.htmlContent,
          trackingId
        );

        // Send email
        const result = await emailService.sendEmail({
          to: email,
          subject: personalizedContent.subject,
          html: htmlWithTracking,
          text: personalizedContent.textContent,
        });

        if (result.success) {
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
            provider: result.provider,
          });

          return { success: true, messageId: result.messageId };
        } else {
          throw new Error(result.error || 'Email sending failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Email sending failed`, {
          campaignId,
          contactId,
          email,
          error: errorMessage,
        });

        // Update tracking record with error
        await EmailTracking.findByIdAndUpdate(trackingId, {
          status: 'failed',
          error: errorMessage,
        });

        // Update campaign metrics
        await this.updateCampaignMetrics(campaignId, 'bounced');

        throw error;
      }
    });

    // Process campaigns
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

        // Get contacts based on audience type
        const contacts = await this.getContactsForCampaign(campaign, userId);

        logger.info(`Processing campaign ${campaignId} for ${contacts.length} contacts`);

        if (contacts.length === 0) {
          campaign.status = 'failed';
          await campaign.save();
          throw new Error('No contacts found for this campaign');
        }

        // Create email jobs for each contact
        const emailJobs = [];
        for (const contact of contacts) {
          const contactId = (contact as any)._id.toString();
          const trackingId = await this.createTrackingRecord(campaignId, contactId);
          
          const personalizedContent = await this.personalizeContent(campaign, contact);

          emailJobs.push({
            campaignId,
            contactId,
            email: contact.email,
            personalizedContent,
            trackingId,
          });
        }

        // Add jobs to queue with delays
        for (let i = 0; i < emailJobs.length; i++) {
          await this.emailQueue.add('send-email', emailJobs[i], {
            delay: i * 2000, // 2 second delay between emails
          });
        }

        // Update campaign metrics
        campaign.metrics.totalRecipients = contacts.length;
        await campaign.save();

        logger.info(`Campaign ${campaignId} queued successfully`, {
          totalEmails: contacts.length,
        });

        return { success: true, totalEmails: contacts.length };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Campaign processing failed`, {
          campaignId,
          error: errorMessage,
        });

        // Update campaign status to failed
        await Campaign.findByIdAndUpdate(campaignId, {
          status: 'failed',
          error: errorMessage,
        });

        throw error;
      }
    });
  }

  private setupEventHandlers() {
    this.emailQueue.on('completed', (job, result) => {
      logger.info(`Email job completed: ${job.id}`, result);
    });

    this.emailQueue.on('failed', (job, err) => {
      logger.error(`Email job failed: ${job.id}`, err.message);
    });

    this.campaignQueue.on('completed', (job, result) => {
      logger.info(`Campaign job completed: ${job.id}`, result);
    });

    this.campaignQueue.on('failed', (job, err) => {
      logger.error(`Campaign job failed: ${job.id}`, err.message);
    });
  }

  private async checkRateLimit(): Promise<void> {
    const key = 'email_rate_limit';
    const limit = 60; // 60 emails per hour for SMTP
    const window = 3600; // 1 hour

    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, window);
      }

      if (current > limit) {
        throw new Error('Rate limit exceeded');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Rate limit check failed, proceeding anyway:', errorMessage);
    }
  }

  private async createTrackingRecord(campaignId: string, contactId: string): Promise<string> {
    const tracking = new EmailTracking({
      campaignId,
      contactId,
      status: 'queued',
      createdAt: new Date(),
    });
    
    await tracking.save();
    return (tracking as any)._id.toString();
  }

  private async personalizeContent(campaign: any, contact: any) {
    let subject = campaign.subject;
    let htmlContent = campaign.htmlContent;
    let textContent = campaign.textContent;

    // Basic personalization replacements
    const replacements = {
      '{{firstName}}': contact.firstName || contact.first_name || 'Friend',
      '{{lastName}}': contact.lastName || contact.last_name || '',
      '{{email}}': contact.email,
      '{{name}}': `${contact.firstName || contact.first_name || ''} ${contact.lastName || contact.last_name || ''}`.trim() || 'Friend',
    };

    // Apply replacements
    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      subject = subject.replace(regex, value);
      htmlContent = htmlContent.replace(regex, value);
      if (textContent) {
        textContent = textContent.replace(regex, value);
      }
    }

    return { subject, htmlContent, textContent };
  }

  private async getContactsForCampaign(campaign: any, userId: string) {
    let contacts = [];

    if (campaign.audienceType === 'segment' && campaign.segments?.length > 0) {
      // Handle regular segments
      contacts = await Contact.find({
        userId,
        segments: { $in: campaign.segments },
        subscribed: true,
      });
      
    } else if (campaign.audienceType === 'landivo') {
      // Handle Landivo campaigns - FIXED IMPLEMENTATION
      contacts = await this.getLandivoContacts(campaign, userId);
      
    } else {
      // All contacts fallback
      contacts = await Contact.find({ 
        userId, 
        subscribed: true 
      });
    }

    logger.info(`Found ${contacts.length} contacts for campaign ${campaign._id}`, {
      audienceType: campaign.audienceType,
      segments: campaign.segments,
    });

    return contacts;
  }

  private async getLandivoContacts(campaign: any, userId: string) {
    try {
      // Get email list ID from campaign
      const emailListId = this.extractEmailListId(campaign);
      
      if (!emailListId) {
        logger.error('No Landivo email list ID found in campaign', { 
          campaignId: campaign._id,
          segments: campaign.segments,
          emailList: campaign.emailList 
        });
        return [];
      }

      logger.info(`Fetching Landivo contacts for email list: ${emailListId}`);

      // Fetch contacts from Landivo
      const landivoContacts = await landivoService.getEmailListWithBuyers(emailListId);

      if (landivoContacts.length === 0) {
        logger.warn(`No contacts found in Landivo email list ${emailListId}`);
        return [];
      }

      // Transform Landivo contacts to campaign contacts format
      const transformedContacts = landivoContacts.map(contact => ({
        _id: contact.landivo_buyer_id, // Use Landivo buyer ID as temp ID
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        first_name: contact.firstName, // Support both naming conventions
        last_name: contact.lastName,
        phone: contact.phone,
        source: 'landivo',
        subscribed: contact.subscribed,
        userId: userId,
      }));

      logger.info(`Successfully transformed ${transformedContacts.length} Landivo contacts`);
      return transformedContacts;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to fetch Landivo contacts:`, {
        error: errorMessage,
        campaignId: campaign._id,
      });
      
      // Don't fail the entire campaign, just return empty array
      return [];
    }
  }

  private extractEmailListId(campaign: any): string | null {
    // Try different possible locations for the email list ID
    if (campaign.emailList) {
      return campaign.emailList;
    }
    
    if (campaign.segments && campaign.segments.length > 0) {
      return campaign.segments[0]; // Take first segment as email list ID
    }
    
    if (campaign.landivoEmailLists && campaign.landivoEmailLists.length > 0) {
      return campaign.landivoEmailLists[0];
    }

    return null;
  }

  private async updateCampaignMetrics(campaignId: string, metric: string) {
    const updateQuery: Record<string, number> = {};
    updateQuery[`metrics.${metric}`] = 1;

    // Also update legacy metrics for backward compatibility
    if (metric === 'sent') {
      updateQuery['metrics.sent'] = 1;
    } else if (metric === 'bounced') {
      updateQuery['metrics.bounces'] = 1;
    }

    await Campaign.findByIdAndUpdate(
      campaignId,
      { $inc: updateQuery },
      { new: true }
    );
  }

  // Public methods
  async sendCampaign(campaignId: string, userId: string): Promise<void> {
    await this.campaignQueue.add('process-campaign', {
      campaignId,
      userId,
    });
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    // Remove pending email jobs for this campaign
    const jobs = await this.emailQueue.getJobs(['waiting', 'delayed']);
    const campaignJobs = jobs.filter(job => job.data.campaignId === campaignId);
    
    for (const job of campaignJobs) {
      await job.remove();
    }

    // Update campaign status
    await Campaign.findByIdAndUpdate(campaignId, {
      status: 'paused',
    });

    logger.info(`Campaign ${campaignId} paused`);
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

  // Cleanup method
  async close(): Promise<void> {
    await this.emailQueue.close();
    await this.campaignQueue.close();
    await this.redis.disconnect();
  }
}

export const emailQueueService = new EmailQueueService();