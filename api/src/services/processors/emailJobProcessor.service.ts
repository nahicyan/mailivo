// api/src/services/processors/emailJobProcessor.service.ts
import Redis from 'ioredis';
import { emailService } from '../email.service';
import { templateRenderingService } from '../templateRendering.service';
import { EmailTracking } from '../../models/EmailTracking.model';
import { Campaign } from '../../models/Campaign';
import { logger } from '../../utils/logger';

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

export class EmailJobProcessor {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  async processEmailJob(job: EmailJob): Promise<{ success: boolean; messageId?: string }> {
    const { campaignId, contactId, email, personalizedContent, trackingId } = job;
    
    try {
      await this.checkRateLimit();

      const htmlWithTracking = await emailService.addTrackingPixel(
        personalizedContent.htmlContent,
        trackingId
      );

      const result = await emailService.sendEmail({
        to: email,
        subject: personalizedContent.subject,
        html: htmlWithTracking,
        text: personalizedContent.textContent,
      });

      if (result.success) {
        await EmailTracking.findByIdAndUpdate(trackingId, {
          status: 'sent',
          sentAt: new Date(),
          messageId: result.messageId,
        });

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

      await EmailTracking.findByIdAndUpdate(trackingId, {
        status: 'failed',
        error: errorMessage,
      });

      await this.updateCampaignMetrics(campaignId, 'bounced');
      throw error;
    }
  }

  async personalizeContent(campaign: any, contact: any): Promise<{
    subject: string;
    htmlContent: string;
    textContent: string;
  }> {
    try {
      if (campaign.source === 'landivo' && campaign.emailTemplate && campaign.property) {
        logger.info(`Rendering template ${campaign.emailTemplate} for property ${campaign.property}`);
        
        const renderedContent = await templateRenderingService.renderTemplate(
          campaign.emailTemplate,
          campaign.property,
          contact,
          campaign.subject 
        );

        return this.applyPersonalization(renderedContent, contact);
      } else {
        return this.applyBasicPersonalization(campaign, contact);
      }
    } catch (error) {
      logger.error('Template personalization failed, using fallback:', error);
      return this.applyBasicPersonalization(campaign, contact);
    }
  }

  async createTrackingRecord(campaignId: string, contactId: string): Promise<string> {
    const tracking = new EmailTracking({
      campaignId,
      contactId,
      status: 'queued',
      createdAt: new Date(),
    });
    
    await tracking.save();
    return (tracking as any)._id.toString();
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

  private applyPersonalization(content: { subject: string; htmlContent: string; textContent: string }, contact: any) {
    const replacements = {
      '{{firstName}}': contact.firstName || contact.first_name || 'Friend',
      '{{lastName}}': contact.lastName || contact.last_name || '',
      '{{email}}': contact.email,
      '{{name}}': `${contact.firstName || contact.first_name || ''} ${contact.lastName || contact.last_name || ''}`.trim() || 'Friend',
      '{{unsubscribeLink}}': `${process.env.NEXT_PUBLIC_SERVER_URL}/api/track/unsubscribe?token=${Buffer.from(`${contact.landivo_buyer_id || contact._id}:${content.subject}`).toString('base64')}`,
    };

    let { subject, htmlContent, textContent } = content;

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

  private applyBasicPersonalization(campaign: any, contact: any) {
    let subject = campaign.subject;
    let htmlContent = campaign.htmlContent;
    let textContent = campaign.textContent;

    const replacements = {
      '{{firstName}}': contact.firstName || contact.first_name || 'Friend',
      '{{lastName}}': contact.lastName || contact.last_name || '',
      '{{email}}': contact.email,
      '{{name}}': `${contact.firstName || contact.first_name || ''} ${contact.lastName || contact.last_name || ''}`.trim() || 'Friend',
    };

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

  private async updateCampaignMetrics(campaignId: string, metric: string) {
    const updateQuery: Record<string, number> = {};
    updateQuery[`metrics.${metric}`] = 1;

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
}