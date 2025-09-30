// api/src/services/processors/campaignProcessor.service.ts - UPDATED FOR MULTIPLE EMAIL LISTS
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
        emailJobs
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
      const contactId = typeof contact === 'string' 
        ? contact 
        : ((contact as any)._id?.toString() || contact.id?.toString() || '');
      
      const contactEmail = typeof contact === 'string'
        ? ''
        : (contact.email || '');
      
      const trackingId = await this.emailJobProcessor.createTrackingRecord(
        campaign._id.toString(), 
        contactId,
        contactEmail,
      );
      
      const personalizedContent = await this.emailJobProcessor.personalizeContent(
        campaign, 
        contact, 
        trackingId
      );

      emailJobs.push({
        campaignId: campaign._id.toString(),
        contactId,
        email: contactEmail || contact.email,
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

  // UPDATED: Handle multiple email lists
  private async getLandivoContacts(campaign: any, userId: string) {
    try {
      const emailListIds = this.extractEmailListIds(campaign);
      
      if (!emailListIds || emailListIds.length === 0) {
        logger.error('No Landivo email list IDs found in campaign', { 
          campaignId: campaign._id,
          segments: campaign.segments,
          emailList: campaign.emailList 
        });
        return [];
      }

      logger.info(`Fetching Landivo contacts for ${emailListIds.length} email list(s)`, { 
        emailListIds 
      });

      // Fetch contacts from all email lists
      const allContactsArrays = await Promise.all(
        emailListIds.map(listId => landivoService.getEmailListWithBuyers(listId))
      );

      // Flatten the arrays
      const allContacts = allContactsArrays.flat();

      if (allContacts.length === 0) {
        logger.warn(`No contacts found in any of the Landivo email lists`, { emailListIds });
        return [];
      }

      // Deduplicate contacts by email address
      const uniqueContactsMap = new Map();
      for (const contact of allContacts) {
        const email = contact.email.toLowerCase().trim();
        if (!uniqueContactsMap.has(email)) {
          uniqueContactsMap.set(email, contact);
        }
      }

      const uniqueContacts = Array.from(uniqueContactsMap.values());

      // Transform to standard format
      const transformedContacts = uniqueContacts.map(contact => ({
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

      logger.info(
        `Successfully processed contacts from ${emailListIds.length} list(s)`, 
        {
          totalFetched: allContacts.length,
          uniqueContacts: transformedContacts.length,
          duplicatesRemoved: allContacts.length - transformedContacts.length
        }
      );

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

  // UPDATED: Extract email list IDs (supports both string and array)
  private extractEmailListIds(campaign: any): string[] {
    // Priority 1: Use emailList field (can be string or array)
    if (campaign.emailList) {
      if (Array.isArray(campaign.emailList)) {
        return campaign.emailList.filter((id: any) => id && typeof id === 'string');
      }
      if (typeof campaign.emailList === 'string') {
        return [campaign.emailList];
      }
    }
    
    // Priority 2: Use segments array (legacy support)
    if (campaign.segments && campaign.segments.length > 0) {
      return campaign.segments;
    }
    
    // Priority 3: Check for legacy landivoEmailLists field
    if (campaign.landivoEmailLists && campaign.landivoEmailLists.length > 0) {
      return campaign.landivoEmailLists;
    }

    return [];
  }
}