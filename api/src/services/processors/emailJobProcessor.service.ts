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
        logger.info(`Rendering template ${campaign.emailTemplate} for property ${campaign.property}`, {
          campaignId: campaign._id,
          selectedPlan: campaign.selectedPlan?.planNumber,
          imageSelections: Object.keys(campaign.imageSelections || {}).length
        });
        
        // Prepare campaign data for template rendering
        const campaignData = {
          selectedPlan: campaign.selectedPlan,
          imageSelections: campaign.imageSelections || {}
        };

        const renderedContent = await templateRenderingService.renderTemplate(
          campaign.emailTemplate,
          campaign.property,
          contact,
          campaign.subject,
          campaignData // Pass campaign data with selected plan and image selections
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
      logger.error('Rate limit check failed:', errorMessage);
      // Don't throw - let email proceed if rate limit check fails
    }
  }

  private async updateCampaignMetrics(campaignId: string, type: 'sent' | 'bounced'): Promise<void> {
    try {
      const update = type === 'sent' 
        ? { $inc: { 'metrics.sent': 1 } }
        : { $inc: { 'metrics.bounced': 1 } };

      await Campaign.findByIdAndUpdate(campaignId, update);
    } catch (error) {
      logger.error(`Failed to update campaign metrics for ${campaignId}:`, error);
      // Don't throw - this is not critical
    }
  }

  private applyPersonalization(content: any, contact: any) {
    const { subject, htmlContent, textContent } = content;

    // Apply personalization tokens
    const personalizedSubject = this.replacePersonalizationTokens(subject, contact);
    const personalizedHtml = this.replacePersonalizationTokens(htmlContent, contact);
    const personalizedText = this.replacePersonalizationTokens(textContent, contact);

    return {
      subject: personalizedSubject,
      htmlContent: personalizedHtml,
      textContent: personalizedText
    };
  }

  private applyBasicPersonalization(campaign: any, contact: any) {
    const subject = this.replacePersonalizationTokens(campaign.subject || campaign.name, contact);
    const htmlContent = this.replacePersonalizationTokens(campaign.htmlContent || '<p>No content</p>', contact);
    const textContent = this.replacePersonalizationTokens(campaign.textContent || campaign.description || '', contact);

    return {
      subject,
      htmlContent,
      textContent
    };
  }

  private replacePersonalizationTokens(content: string, contact: any): string {
    if (!content) return '';

    return content
      .replace(/\{\{firstName\}\}/g, contact.firstName || contact.first_name || '')
      .replace(/\{\{lastName\}\}/g, contact.lastName || contact.last_name || '')
      .replace(/\{\{email\}\}/g, contact.email || '')
      .replace(/\{\{name\}\}/g, `${contact.firstName || contact.first_name || ''} ${contact.lastName || contact.last_name || ''}`.trim());
  }
}