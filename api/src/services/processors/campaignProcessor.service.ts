// api/src/services/processors/campaignProcessor.service.ts
import { landivoService } from '../landivo.service';
import { Campaign } from '../../models/Campaign';
import { Contact } from '../../models/Contact.model';
import { EmailJobProcessor } from './emailJobProcessor.service';
import { logger } from '../../utils/logger';

interface CampaignJob {
  campaignId: string;
  userId: string;
}

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

export class CampaignProcessor {
  private emailJobProcessor: EmailJobProcessor;

  constructor() {
    this.emailJobProcessor = new EmailJobProcessor();
  }

  async processCampaign(job: CampaignJob): Promise<{ success: boolean; totalEmails: number }> {
    const { campaignId, userId } = job;
    
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      campaign.status = 'sending';
      await campaign.save();

      const contacts = await this.getContactsForCampaign(campaign, userId);

      logger.info(`Processing campaign ${campaignId} for ${contacts.length} contacts`);

      if (contacts.length === 0) {
        campaign.status = 'failed';
        await campaign.save();
        throw new Error('No contacts found for this campaign');
      }

      const emailJobs = await this.createEmailJobs(campaign, contacts);
      
      campaign.metrics.totalRecipients = contacts.length;
      await campaign.save();

      logger.info(`Campaign ${campaignId} prepared ${emailJobs.length} email jobs`);

      return { 
        success: true, 
        totalEmails: emailJobs.length,
        emailJobs // Return jobs for queue processing
      } as any;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Campaign processing failed`, { campaignId, error: errorMessage });

      await Campaign.findByIdAndUpdate(campaignId, { status: 'failed' });
      throw error;
    }
  }

  private async createEmailJobs(campaign: any, contacts: any[]): Promise<EmailJob[]> {
    const emailJobs = [];
    
    for (const contact of contacts) {
      const contactId = (contact as any)._id.toString();
      const trackingId = await this.emailJobProcessor.createTrackingRecord(campaign._id, contactId);
      
      const personalizedContent = await this.emailJobProcessor.personalizeContent(campaign, contact);

      emailJobs.push({
        campaignId: campaign._id,
        contactId,
        email: contact.email,
        personalizedContent,
        trackingId,
      });
    }

    return emailJobs;
  }

  private async getContactsForCampaign(campaign: any, userId: string) {
    let contacts = [];

    if (campaign.audienceType === 'segment' && campaign.segments?.length > 0) {
      contacts = await Contact.find({
        userId,
        segments: { $in: campaign.segments },
        subscribed: true,
      });
      
    } else if (campaign.audienceType === 'landivo') {
      contacts = await this.getLandivoContacts(campaign, userId);
      
    } else {
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

      const landivoContacts = await landivoService.getEmailListWithBuyers(emailListId);

      if (landivoContacts.length === 0) {
        logger.warn(`No contacts found in Landivo email list ${emailListId}`);
        return [];
      }

      const transformedContacts = landivoContacts.map(contact => ({
        _id: contact.landivo_buyer_id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        first_name: contact.firstName,
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
      
      return [];
    }
  }

  private extractEmailListId(campaign: any): string | null {
    if (campaign.emailList) {
      return campaign.emailList;
    }
    
    if (campaign.segments && campaign.segments.length > 0) {
      return campaign.segments[0];
    }
    
    if (campaign.landivoEmailLists && campaign.landivoEmailLists.length > 0) {
      return campaign.landivoEmailLists[0];
    }

    return null;
  }
}