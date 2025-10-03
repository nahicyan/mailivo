// api/src/services/campaign-creator.service.ts
import { Campaign } from "../models/Campaign";
import { EmailTracking } from "../models/EmailTracking.model";
import { templateRenderingService } from "./templateRendering.service";
import { linkTrackingService } from "./linkTracking.service";
import { logger } from "../utils/logger";
import axios from "axios";
import Bull from "bull";
import { nanoid } from "nanoid";

const LANDIVO_API_URL = process.env.LANDIVO_API_URL || "https://api.landivo.com";

// Initialize email queue for direct job addition
const emailQueue = new Bull("email-sending", {
  redis: {
    port: parseInt(process.env.REDIS_PORT || "6379"),
    host: process.env.REDIS_HOST || "localhost",
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

      // 2. Fetch recipients from email list (only 2 params)
      const recipients = await this.fetchRecipients(config.emailList, triggerData);

      if (recipients.length === 0) {
        throw new Error("No recipients found in email list");
      }

      // 3. Resolve subject (bypass or use configured)
      const resolvedSubject = this.resolveSubject(config.subject, triggerData);

      // 4. Enrich campaign data with payment plans and images
      const enrichedCampaignData = await this.enrichCampaignData(config, propertyIds[0]);

      // 5. Create campaign record
      const campaign = await this.createCampaignRecord({
        userId,
        name: config.name,
        subject: resolvedSubject,
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

      // 6. Queue emails based on schedule (all 5 params)
      if (config.schedule === "immediate") {
        await this.queueCampaignEmails(campaign, recipients, propertyIds, enrichedCampaignData, resolvedSubject);
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
        return triggerData.propertyIds || [];

      case "condition":
        return triggerData.propertyIds || [];

      case "manual":
        return propertySelection.propertyIds || [];

      default:
        return [];
    }
  }

  /**
   * Resolve subject (bypass or use configured)
   */
  private resolveSubject(configuredSubject: string, triggerData: any): string {
    if (configuredSubject?.toLowerCase() === "bypass") {
      return triggerData.propertyData?.subject || "New Property Alert";
    }
    return configuredSubject;
  }

  /**
   * Enrich campaign data with payment plans and images
   */
  private async enrichCampaignData(config: any, propertyId: string): Promise<any> {
    const baseData: any = {
      selectedAgent: config.selectedAgent,
      componentConfig: config.componentConfig || {},
      imageSelections: config.imageSelections || {},
      multiPropertyConfig: config.multiPropertyConfig,
    };

    try {
      // Correct endpoint: /residency/${id} not /residency/get/${id}
      const response = await axios.get(`${LANDIVO_API_URL}/residency/${propertyId}`, { timeout: 5000 });
      const property = response.data;

      // Auto-select first payment plan if available
      if (property.paymentPlans && property.paymentPlans.length > 0) {
        baseData.selectedPaymentPlan = property.paymentPlans[0];
      }

      // Auto-select first image if available
      if (property.images && property.images.length > 0) {
        baseData.selectedImage = property.images[0];
        baseData.imageSelections = {
          hero: property.images[0],
          gallery: property.images[0],
          ...baseData.imageSelections,
        };
      }

      logger.info("Campaign data enriched", {
        propertyId,
        hasPaymentPlan: !!baseData.selectedPaymentPlan,
        hasImage: !!baseData.selectedImage,
      });

      return baseData;
    } catch (error: any) {
      logger.warn("Property enrichment failed, using defaults", {
        propertyId,
        error: error.message,
        status: error.response?.status,
      });

      return baseData;
    }
  }

  /**
   * Fetch recipients from email list (supports dynamic matching)
   * Only 2 parameters: emailListConfig and triggerData
   */
  private async fetchRecipients(emailListConfig: string, triggerData: any): Promise<any[]> {
    try {
      let emailListIds: string[] = [];

      // Handle special matching instructions
      if (emailListConfig === "Match-Title" || emailListConfig === "Match-Area") {
        emailListIds = await this.matchEmailLists(emailListConfig, triggerData);
      } else {
        emailListIds = [emailListConfig];
      }

      if (emailListIds.length === 0) {
        throw new Error("No matching email lists found");
      }

      logger.info("Matched email lists", { emailListIds, config: emailListConfig });

      // Fetch contacts from all matched lists
      const allContacts: any[] = [];

      for (const listId of emailListIds) {
        try {
          // Correct Landivo endpoint - buyers are in the list response
          const response = await axios.get(`${LANDIVO_API_URL}/email-lists/${listId}`);

          // Buyers are directly in the response or nested
          const buyers = response.data?.buyers || response.data || [];

          if (Array.isArray(buyers) && buyers.length > 0) {
            logger.info(`Found ${buyers.length} buyers in list ${listId}`);
            allContacts.push(...buyers);
          } else {
            logger.warn(`No buyers found in list ${listId}`);
          }
        } catch (error: any) {
          logger.error(`Failed to fetch buyers from list ${listId}`, {
            error: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });
        }
      }

      if (allContacts.length === 0) {
        logger.warn("No contacts found across all matched lists");
        return [];
      }

      // Deduplicate by email and filter valid contacts
      const uniqueContacts = Array.from(new Map(allContacts.map((c) => [c.email?.toLowerCase(), c])).values());

      // Filter for valid, active contacts
      const validContacts = uniqueContacts.filter((c: any) => {
        const hasEmail = c.email && c.email.includes("@");
        const isActive = c.emailStatus === "available" || !c.unsubscribed;
        return hasEmail && isActive;
      });

      logger.info(`Processed contacts`, {
        total: allContacts.length,
        unique: uniqueContacts.length,
        valid: validContacts.length,
      });

      return validContacts;
    } catch (error: any) {
      logger.error("Failed to fetch recipients", {
        emailListConfig,
        error: error.message,
      });
      throw new Error(`Failed to fetch recipients: ${error.message}`);
    }
  }

  /**
   * Match email lists based on trigger data
   */
  private async matchEmailLists(matchType: string, triggerData: any): Promise<string[]> {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/email-lists`);
      const emailLists = response.data;

      if (!Array.isArray(emailLists)) {
        return [];
      }

      const matchedLists: string[] = [];

      for (const list of emailLists) {
        let matches = false;

        if (matchType === "Match-Title") {
          const area = triggerData.propertyData?.area || "";
          matches = list.name?.toLowerCase().includes(area.toLowerCase());
        } else if (matchType === "Match-Area") {
          const area = triggerData.propertyData?.area || "";
          matches = list.criteria?.areas?.some((a: string) => a.toLowerCase() === area.toLowerCase());
        }

        if (matches && list.id) {
          matchedLists.push(list.id);
        }
      }

      logger.info("Email list matching result", {
        matchType,
        area: triggerData.propertyData?.area,
        matchedCount: matchedLists.length,
      });

      return matchedLists;
    } catch (error: any) {
      logger.error("Failed to match email lists", { error: error.message });
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
      description: data.description || "",

      // Required fields
      type: data.campaignType === "single_property" ? "single" : "multi-property",
      htmlContent: "<p>Automation-generated campaign - content rendered per recipient</p>",
      textContent: "Automation-generated campaign",

      // Source must be valid enum
      source: "landivo",

      // Property data
      property: data.propertyIds.length === 1 ? data.propertyIds[0] : data.propertyIds,

      // Email list
      emailList: data.emailList,
      emailTemplate: data.emailTemplate,
      selectedAgent: data.selectedAgent,
      emailSchedule: data.schedule,
      scheduledDate: data.scheduledDate,

      // Status and volume
      status: "draft",
      emailVolume: 0,

      // Metrics
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        totalClicks: 0,
        bounced: 0,
        complained: 0,
        totalRecipients: 0,
        open: 0,
        bounces: 0,
        successfulDeliveries: 0,
        clicks: 0,
        didNotOpen: 0,
        mobileOpen: 0,
        failed: 0,
        hardBounces: 0,
        softBounces: 0,
      },
    });

    await campaign.save();
    return campaign;
  }

  /**
   * Queue emails for campaign
   * Takes 5 parameters: campaign, recipients, propertyIds, campaignData, campaignSubject
   */
  private async queueCampaignEmails(campaign: any, recipients: any[], propertyIds: string[], campaignData: any, campaignSubject: string): Promise<void> {
    try {
      logger.info("Queueing campaign emails", {
        campaignId: campaign._id,
        recipientCount: recipients.length,
      });

      campaign.status = "sending";
      campaign.emailVolume = recipients.length;
      await campaign.save();

      let successCount = 0;
      let failCount = 0;

      for (const contact of recipients) {
        try {
          const email = contact.email?.trim().toLowerCase();
          if (!email || !email.includes("@")) {
            logger.warn("Skipping invalid email", { contact });
            failCount++;
            continue;
          }

          const contactData = {
            email,
            firstName: contact.firstName || "",
            lastName: contact.lastName || "",
            fullName: `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
          };

          const contactId = contact._id?.toString() || contact.id || email;

          // 1. Generate trackingId upfront
          const trackingId = `${campaign._id}_${email}_${nanoid(10)}`;

          // 2. Create tracking record
          await EmailTracking.create({
            campaignId: campaign._id.toString(),
            contactId,
            contactEmail: email,
            trackingId,
            status: "queued",
            links: [],
            linkClicks: [],
            linkStats: new Map(),
          });

          // 3. Render template
          const rendered = await templateRenderingService.renderTemplate(
            campaign.emailTemplate,
            propertyIds.length === 1 ? propertyIds[0] : propertyIds,
            contactData,
            campaignSubject,
            campaignData
          );

          // 4. Transform links with tracking
          const { transformedHtml, extractedLinks } = await linkTrackingService.transformLinks(rendered.htmlContent, {
            trackingId,
            campaignId: campaign._id.toString(),
            contactId,
            baseUrl: process.env.API_URL || "https://api.mailivo.landivo.com",
          });

          // 5. Update tracking record with links
          if (extractedLinks.length > 0) {
            await EmailTracking.findOneAndUpdate({ trackingId }, { $set: { links: extractedLinks } });
            logger.info(`Stored ${extractedLinks.length} tracking links`, { trackingId });
          }

          // 6. Queue email with transformed HTML
          await emailQueue.add(
            "send-email",
            {
              campaignId: campaign._id.toString(),
              contactId,
              email,
              personalizedContent: {
                subject: rendered.subject,
                htmlContent: transformedHtml,
                textContent: rendered.textContent,
              },
              trackingId,
            },
            {
              delay: successCount * 100,
              attempts: 3,
              backoff: { type: "exponential", delay: 30000 },
            }
          );

          successCount++;
        } catch (error: any) {
          logger.error("Failed to queue email", {
            contact: contact.email,
            error: error.message,
          });
          failCount++;
        }
      }

      logger.info("Campaign emails queued", {
        campaignId: campaign._id,
        success: successCount,
        failed: failCount,
      });

      if (successCount === 0) {
        throw new Error("Failed to queue any emails");
      }
    } catch (error: any) {
      logger.error("Failed to queue campaign emails", {
        campaignId: campaign._id,
        error: error.message,
      });

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
