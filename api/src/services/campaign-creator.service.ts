// api/src/services/campaign-creator.service.ts
import { Campaign } from '../models/Campaign';
import { templateRenderingService } from './templateRendering.service';
import { logger } from '../utils/logger';
import axios from 'axios';
import Bull from 'bull';

const LANDIVO_API_URL = process.env.LANDIVO_API_URL || 'https://api.landivo.com';

// Initialize email queue for direct job addition
const emailQueue = new Bull('email-sending', {
  redis: {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
  },
});

interface CampaignResult {
  campaignId: string;
  recipientCount: number;
  status: string;
}

class CampaignCreatorService {
  /**
   * Create campaign from automation configuration
   */
  async createCampaignFromAutomation(
    automation: any,
    triggerData: any,
    executionId: string
  ): Promise<CampaignResult> {
    const { action, userId } = automation;
    const { config } = action;

    try {
      logger.info('Creating campaign from automation', { 
        automationId: automation._id,
        executionId 
      });

      // 1. Determine property IDs based on property selection source
      const propertyIds = await this.resolvePropertyIds(config, triggerData);

      if (!propertyIds || propertyIds.length === 0) {
        throw new Error('No properties found for campaign');
      }

      // 2. Fetch recipients from email list
      const recipients = await this.fetchRecipients(config.emailList, userId, triggerData);

      if (recipients.length === 0) {
        throw new Error('No recipients found in email list');
      }

      // 3. Resolve subject (bypass or use configured)
      const campaignSubject = this.resolveSubject(config.subject, triggerData);

      // 4. Enrich campaign data with payment plans and images
      const enrichedCampaignData = await this.enrichCampaignData(config, propertyIds[0]);
      const campaign = await this.createCampaignRecord({
        userId,
        name: config.name,
        subject: config.subject,
        description: config.description,
        propertyIds,
        emailList: config.emailList,
        emailTemplate: config.emailTemplate,
        selectedAgent: config.selectedAgent,
        schedule: config.schedule,
        scheduledDate: config.scheduledDate,
        campaignType: config.campaignType,
        source: 'automation',
        automationId: automation._id,
        executionId
      });

      logger.info('Campaign record created', { campaignId: campaign._id });

      // 4. Queue emails based on schedule
      if (config.schedule === 'immediate') {
        await this.queueCampaignEmails(campaign, recipients, propertyIds, config);
      } else if (config.schedule === 'scheduled' && config.scheduledDate) {
        // Schedule for later - update campaign status
        campaign.status = 'scheduled';
        await campaign.save();
      } else if (config.schedule === 'time_delay' && config.delay) {
        // Calculate delay and schedule
        const delayMs = this.calculateDelay(config.delay);
        const scheduledDate = new Date(Date.now() + delayMs);
        campaign.scheduledDate = scheduledDate;
        campaign.status = 'scheduled';
        await campaign.save();
      }

      return {
        campaignId: campaign._id.toString(),
        recipientCount: recipients.length,
        status: campaign.status
      };

    } catch (error: any) {
      logger.error('Campaign creation failed', { 
        error: error.message,
        automationId: automation._id 
      });
      throw error;
    }
  }

  /**
   * Resolve property IDs based on selection source
   */
  private async resolvePropertyIds(config: any, triggerData: any): Promise<string[]> {
    const { propertySelection } = config;

    switch (propertySelection.source) {
      case 'trigger':
        // Use properties from trigger
        return triggerData.propertyIds || [];

      case 'condition':
        // Properties already filtered by conditions in matcher
        return triggerData.propertyIds || [];

      case 'manual':
        // Use manually selected properties
        return propertySelection.propertyIds || [];

      default:
        return [];
    }
  }

  /**
   * Fetch recipients from email list (supports dynamic matching)
   */
  private async fetchRecipients(emailListConfig: string, triggerData: any): Promise<any[]> {
    try {
      let emailListIds: string[] = [];

      // Handle special matching instructions
      if (emailListConfig === 'Match-Title' || emailListConfig === 'Match-Area') {
        emailListIds = await this.matchEmailLists(emailListConfig, triggerData);
      } else {
        // Direct email list ID
        emailListIds = [emailListConfig];
      }

      if (emailListIds.length === 0) {
        throw new Error('No matching email lists found');
      }

      logger.info('Matched email lists', { emailListIds, config: emailListConfig });

      // Fetch contacts from all matched lists
      const allContacts: any[] = [];
      
      for (const listId of emailListIds) {
        try {
          const response = await axios.get(
            `${LANDIVO_API_URL}/email-list-contacts/${listId}`
          );
          
          if (response.data && Array.isArray(response.data)) {
            allContacts.push(...response.data);
          }
        } catch (error: any) {
          logger.error(`Failed to fetch contacts from list ${listId}`, { error: error.message });
          // Continue with other lists
        }
      }

      // Deduplicate by email and filter active contacts
      const uniqueContacts = Array.from(
        new Map(allContacts.map(c => [c.email?.toLowerCase(), c])).values()
      );

      return uniqueContacts.filter((c: any) => 
        c.email && 
        c.email.includes('@') && 
        !c.unsubscribed
      );

    } catch (error: any) {
      logger.error('Failed to fetch recipients', { 
        emailListConfig, 
        error: error.message 
      });
      throw new Error(`Failed to fetch recipients: ${error.message}`);
    }
  }

  /**
   * Resolve subject (bypass or use configured)
   */
  private resolveSubject(configuredSubject: string, triggerData: any): string {
    if (configuredSubject?.toLowerCase() === 'bypass') {
      // Use subject from trigger payload
      return triggerData.propertyData?.subject || 'New Property Alert';
    }
    return configuredSubject;
  }

  /**
   * Enrich campaign data with payment plans and images
   */
  private async enrichCampaignData(config: any, propertyId: string): Promise<any> {
    try {
      // Fetch property details to get payment plans and images
      const response = await axios.get(`${LANDIVO_API_URL}/residency/get/${propertyId}`);
      const property = response.data;

      const enrichedData: any = {
        selectedAgent: config.selectedAgent,
        componentConfig: config.componentConfig || {},
        imageSelections: config.imageSelections || {},
        multiPropertyConfig: config.multiPropertyConfig
      };

      // Auto-select first payment plan if available
      if (property.paymentPlans && property.paymentPlans.length > 0) {
        enrichedData.selectedPaymentPlan = property.paymentPlans[0];
      }

      // Auto-select first image if available
      if (property.images && property.images.length > 0) {
        enrichedData.selectedImage = property.images[0];
        // Set default image selection for all components that need images
        enrichedData.imageSelections = {
          hero: property.images[0],
          gallery: property.images[0],
          ...enrichedData.imageSelections
        };
      }

      logger.info('Campaign data enriched', { 
        propertyId,
        hasPaymentPlan: !!enrichedData.selectedPaymentPlan,
        hasImage: !!enrichedData.selectedImage
      });

      return enrichedData;
    } catch (error: any) {
      logger.error('Failed to enrich campaign data', { error: error.message });
      // Return basic config if enrichment fails
      return {
        selectedAgent: config.selectedAgent,
        componentConfig: config.componentConfig || {},
        imageSelections: config.imageSelections || {},
        multiPropertyConfig: config.multiPropertyConfig
      };
    }
  }

  /**
   * Match email lists based on trigger data
   */
  private async matchEmailLists(matchType: string, triggerData: any): Promise<string[]> {
    try {
      // Fetch all email lists
      const response = await axios.get(`${LANDIVO_API_URL}/email-lists`);
      const emailLists = response.data;

      if (!Array.isArray(emailLists)) {
        return [];
      }

      const matchedLists: string[] = [];

      for (const list of emailLists) {
        let matches = false;

        if (matchType === 'Match-Title') {
          // Match by list name (case-insensitive)
          const area = triggerData.propertyData?.area || '';
          matches = list.name?.toLowerCase().includes(area.toLowerCase());
        } else if (matchType === 'Match-Area') {
          // Match by criteria.areas
          const area = triggerData.propertyData?.area || '';
          matches = list.criteria?.areas?.some((a: string) => 
            a.toLowerCase() === area.toLowerCase()
          );
        }

        if (matches && list.id) {
          matchedLists.push(list.id);
        }
      }

      logger.info('Email list matching result', { 
        matchType, 
        area: triggerData.propertyData?.area,
        matchedCount: matchedLists.length 
      });

      return matchedLists;
    } catch (error: any) {
      logger.error('Failed to match email lists', { error: error.message });
      return [];
    }
  }

  /**
   * Create campaign record in database
   */
  private async createCampaignRecord(data: any): Promise<any> {
    const campaign = new Campaign({
      userId: data.userId,
      name: data.name,
      subject: data.subject,
      description: data.description || '',
      source: data.source,
      property: data.propertyIds[0], // Primary property for single property campaigns
      properties: data.propertyIds,
      emailList: data.emailList,
      emailTemplate: data.emailTemplate,
      selectedAgent: data.selectedAgent,
      emailSchedule: data.schedule,
      scheduledDate: data.scheduledDate,
      campaignType: data.campaignType,
      status: 'draft',
      emailVolume: 0,
      metrics: {
        sent: 0,
        opened: 0,
        clicked: 0,
        bounces: 0,
        successfulDeliveries: 0,
        didNotOpen: 0,
        mobileOpen: 0
      },
      automationId: data.automationId,
      executionId: data.executionId
    });

    await campaign.save();
    return campaign;
  }

  /**
   * Queue emails for campaign
   */
  private async queueCampaignEmails(
    campaign: any,
    recipients: any[],
    propertyIds: string[],
    campaignData: any,
    campaignSubject: string
  ): Promise<void> {
    try {
      logger.info('Queueing campaign emails', { 
        campaignId: campaign._id,
        recipientCount: recipients.length 
      });

      // Update campaign status
      campaign.status = 'sending';
      campaign.emailVolume = recipients.length;
      await campaign.save();

      // Queue each email
      for (const contact of recipients) {
        try {
          // Render email content for this specific contact
          const contactData = {
            email: contact.email,
            firstName: contact.firstName || '',
            lastName: contact.lastName || '',
            fullName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
          };

          // Render template with property and contact data
          const rendered = await templateRenderingService.renderTemplate(
            campaign.emailTemplate,
            propertyIds.length === 1 ? propertyIds[0] : propertyIds,
            contactData,
            campaignSubject,
            campaignData
          );

          // Add email job to queue
          await emailQueue.add('send-email', {
            campaignId: campaign._id.toString(),
            contactId: contact._id?.toString() || contact.email,
            email: contact.email,
            personalizedContent: {
              subject: rendered.subject,
              htmlContent: rendered.htmlContent,
              textContent: rendered.textContent
            },
            trackingId: `${campaign._id}_${contact.email}_${Date.now()}`
          }, {
            delay: 0,
            attempts: 3,
            backoff: { type: 'exponential', delay: 30000 }
          });

        } catch (error: any) {
          logger.error('Failed to queue email for contact', { 
            contact: contact.email,
            error: error.message 
          });
          // Continue with other contacts
        }
      }

      logger.info('Campaign emails queued successfully', { 
        campaignId: campaign._id 
      });

    } catch (error: any) {
      logger.error('Failed to queue campaign emails', { 
        campaignId: campaign._id,
        error: error.message 
      });
      
      // Update campaign status to failed
      campaign.status = 'failed';
      await campaign.save();
      
      throw error;
    }
  }

  /**
   * Calculate delay in milliseconds
   */
  private calculateDelay(delay: { amount: number; unit: string }): number {
    const { amount, unit } = delay;

    switch (unit) {
      case 'minutes':
        return amount * 60 * 1000;
      case 'hours':
        return amount * 60 * 60 * 1000;
      case 'days':
        return amount * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }
}

export const campaignCreatorService = new CampaignCreatorService();