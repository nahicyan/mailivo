// api/src/services/campaign-creator.service.ts
import { Campaign } from "../models/Campaign";
import { templateRenderingService } from "./templateRendering.service";
import { emailQueueService } from "./emailQueue.service";
import { logger } from "../utils/logger";
import axios from "axios";

const LANDIVO_API_URL = process.env.LANDIVO_API_URL || "https://api.landivo.com";

interface CampaignResult {
  campaignId: string;
  recipientCount: number;
  status: string;
}

class CampaignCreatorService {
  /**
   * Create campaign from automation configuration
   */
  async createCampaignFromAutomation(automation: any, triggerData: any, executionId: string): Promise<CampaignResult> {
    const { action, userId } = automation;
    const { config } = action;

    try {
      logger.info("Creating campaign from automation", {
        automationId: automation._id,
        executionId,
      });

      // 1. Determine property IDs based on property selection source
      const propertyIds = await this.resolvePropertyIds(config, triggerData);

      if (!propertyIds || propertyIds.length === 0) {
        throw new Error("No properties found for campaign");
      }

      // 2. Fetch recipients from email list
      const recipients = await this.fetchRecipients(config.emailList);

      if (recipients.length === 0) {
        throw new Error("No recipients found in email list");
      }

      // 3. Create campaign record
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
        source: "automation",
        automationId: automation._id,
        executionId,
      });

      logger.info("Campaign record created", { campaignId: campaign._id });

      // 4. Queue emails based on schedule
      if (config.schedule === "immediate") {
        await this.queueCampaignEmails(campaign, recipients, propertyIds, config);
      } else if (config.schedule === "scheduled" && config.scheduledDate) {
        // Schedule for later - update campaign status
        campaign.status = "scheduled";
        await campaign.save();
      } else if (config.schedule === "time_delay" && config.delay) {
        // Calculate delay and schedule
        const delayMs = this.calculateDelay(config.delay);
        const scheduledDate = new Date(Date.now() + delayMs);
        campaign.scheduledDate = scheduledDate;
        campaign.status = "scheduled";
        await campaign.save();
      }

      return {
        campaignId: campaign._id.toString(),
        recipientCount: recipients.length,
        status: campaign.status,
      };
    } catch (error: any) {
      logger.error("Campaign creation failed", {
        error: error.message,
        automationId: automation._id,
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
      case "trigger":
        // Use properties from trigger
        return triggerData.propertyIds || [];

      case "condition":
        // Properties already filtered by conditions in matcher
        return triggerData.propertyIds || [];

      case "manual":
        // Use manually selected properties
        return propertySelection.propertyIds || [];

      default:
        return [];
    }
  }

  /**
   * Fetch recipients from email list
   */
  private async fetchRecipients(emailListId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/email-list-contacts/${emailListId}`);

      const contacts = response.data;

      // Filter active contacts with valid emails
      return contacts.filter((c: any) => c.email && c.email.includes("@") && !c.unsubscribed);
    } catch (error: any) {
      logger.error("Failed to fetch recipients", {
        emailListId,
        error: error.message,
      });
      throw new Error(`Failed to fetch recipients: ${error.message}`);
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
      description: data.description || "",
      source: data.source,
      property: data.propertyIds[0], // Primary property for single property campaigns
      properties: data.propertyIds,
      emailList: data.emailList,
      emailTemplate: data.emailTemplate,
      selectedAgent: data.selectedAgent,
      emailSchedule: data.schedule,
      scheduledDate: data.scheduledDate,
      campaignType: data.campaignType,
      status: "draft",
      emailVolume: 0,
      metrics: {
        sent: 0,
        opened: 0,
        clicked: 0,
        bounces: 0,
        successfulDeliveries: 0,
        didNotOpen: 0,
        mobileOpen: 0,
      },
      automationId: data.automationId,
      executionId: data.executionId,
    });

    await campaign.save();
    return campaign;
  }

  /**
   * Queue emails for campaign
   */
  private async queueCampaignEmails(campaign: any, recipients: any[], propertyIds: string[], config: any): Promise<void> {
    try {
      logger.info("Queueing campaign emails", {
        campaignId: campaign._id,
        recipientCount: recipients.length,
      });

      // Update campaign status and metrics
      campaign.status = "sending";
      campaign.emailVolume = recipients.length;
      campaign.metrics.totalRecipients = recipients.length;
      await campaign.save();

      // Prepare email jobs
      const emailJobs = [];

      for (const contact of recipients) {
        try {
          // Render email content for this specific contact
          const contactData = {
            email: contact.email,
            firstName: contact.firstName || "",
            lastName: contact.lastName || "",
            fullName: `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
          };

          const campaignData = {
            selectedAgent: config.selectedAgent,
            componentConfig: config.componentConfig,
            imageSelections: config.imageSelections,
            multiPropertyConfig: config.multiPropertyConfig,
          };

          // Render template with property and contact data
          const rendered = await templateRenderingService.renderTemplate(
            config.emailTemplate,
            propertyIds.length === 1 ? propertyIds[0] : propertyIds,
            contactData,
            campaign.subject,
            campaignData
          );

          // Add to jobs array
          emailJobs.push({
            campaignId: campaign._id.toString(),
            contactId: contact._id?.toString() || contact.email,
            email: contact.email,
            personalizedContent: {
              subject: rendered.subject,
              htmlContent: rendered.htmlContent,
              textContent: rendered.textContent,
            },
            trackingId: `${campaign._id}_${contact.email}_${Date.now()}`,
          });
        } catch (error: any) {
          logger.error("Failed to prepare email for contact", {
            contact: contact.email,
            error: error.message,
          });
          // Continue with other contacts
        }
      }

      // Queue all emails using the campaign queue
      // This delegates to the proper email queue service
      await emailQueueService.sendCampaign(campaign._id.toString(), campaign.userId);

      logger.info("Campaign queued for sending", {
        campaignId: campaign._id,
        emailsQueued: emailJobs.length,
      });
    } catch (error: any) {
      logger.error("Failed to queue campaign emails", {
        campaignId: campaign._id,
        error: error.message,
      });

      // Update campaign status to failed
      campaign.status = "failed";
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
      case "minutes":
        return amount * 60 * 1000;
      case "hours":
        return amount * 60 * 60 * 1000;
      case "days":
        return amount * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }
}

export const campaignCreatorService = new CampaignCreatorService();
