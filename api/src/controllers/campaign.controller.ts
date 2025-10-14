// api/src/controllers/campaign.controller.ts
import { Request, Response } from "express";
import { Campaign } from "../models/Campaign";
import { Contact } from "../models/Contact.model";
import { EmailTracking } from "../models/EmailTracking.model";
import { emailQueueService } from "../services/emailQueue.service";
import { emailService } from "../services/email.service";
import { logger } from "../utils/logger";

interface AuthRequest extends Request {
  user?: { _id: string };
}

class CampaignController {
  // Get all campaigns for user (alias for route compatibility)
  async getAllCampaigns(req: AuthRequest, res: Response): Promise<void> {
    return this.getCampaigns(req, res);
  }

  // Get all campaigns for user
  async getCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const campaigns = await Campaign.find({ userId }).sort({ createdAt: -1 }).lean();

      res.json(campaigns);
    } catch (error) {
      logger.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  }

  // Create new campaign
  async createCampaign(req: AuthRequest, res: Response): Promise<void> {
    console.log("Received request body:", JSON.stringify(req.body, null, 2));
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      // Validate required fields
      const { name, subject, htmlContent } = req.body;
      if (!name || !subject || !htmlContent) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Check spam score before creating
      const spamScore = await emailService.checkSpamScore(htmlContent, subject);
      if (spamScore > 7) {
        res.status(400).json({
          error: "Content has high spam score",
          spamScore,
          suggestions: ["Reduce excessive capitalization", "Remove spam trigger words", "Balance text and HTML content", "Reduce number of links"],
        });
        return;
      }

      const campaignData = {
        ...req.body,
        userId,
        status: req.body.status || "draft",
        spamScore,
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          complained: 0,
          totalRecipients: 0,
        },
      };

      const campaign = new Campaign(campaignData);

      // SCHEDULING LOGIC:
      const { emailSchedule, scheduledDate } = req.body;

      if (emailSchedule === "scheduled" && scheduledDate) {
        // Combine date with time
        const scheduledDateTime = new Date(scheduledDate);
        if (req.body.scheduledHour && req.body.scheduledMinute) {
          scheduledDateTime.setHours(parseInt(req.body.scheduledHour), parseInt(req.body.scheduledMinute), 0, 0);
        }

        campaign.scheduledDate = scheduledDateTime;
        campaign.status = "scheduled";
      } else if (emailSchedule === "immediate") {
        campaign.status = "sending";
        campaign.sentAt = new Date();
      }

      await campaign.save();

      // ADD THIS: Queue emails immediately for immediate campaigns
      if (emailSchedule === "immediate") {
        await emailQueueService.sendCampaign(campaign._id!.toString(), userId);
        logger.info(`Immediate campaign queued: ${campaign._id}`, { userId });
      }

      logger.info(`Campaign created: ${campaign._id}`, { userId, spamScore });
      res.status(201).json(campaign);
    } catch (error) {
      logger.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  }

  // Get single campaign
  async getCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      res.json(campaign);
    } catch (error) {
      logger.error("Error fetching campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  }

  // Send campaign - REAL IMPLEMENTATION
  async sendCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      if (campaign.status === "sent") {
        res.status(400).json({ error: "Campaign already sent" });
        return;
      }

      if (campaign.status === "sending") {
        res.status(400).json({ error: "Campaign is currently sending" });
        return;
      }

      // Validate campaign content
      if (!campaign.subject || !campaign.htmlContent) {
        res.status(400).json({ error: "Campaign missing content" });
        return;
      }

      // Check deliverability metrics
      const reputation = await emailService.checkDomainReputation();
      if (reputation.reputationScore < 6) {
        res.status(400).json({
          error: "Domain reputation too low for sending",
          reputation,
        });
        return;
      }

      // Validate recipient count
      let recipientCount = 0;
      if (campaign.audienceType === "all") {
        recipientCount = await Contact.countDocuments({
          userId,
          subscribed: true,
        });
      } else if (campaign.audienceType === "segment") {
        recipientCount = await Contact.countDocuments({
          userId,
          segments: { $in: campaign.segments },
          subscribed: true,
        });
      } else if (campaign.audienceType === "landivo") {
        // Count would come from Landivo integration
        recipientCount = campaign.estimatedRecipients || 0;
      }

      if (recipientCount === 0) {
        res.status(400).json({ error: "No recipients found for this campaign" });
        return;
      }

      // Start sending process
      await emailQueueService.sendCampaign(id, userId);

      // Update campaign status
      campaign.status = "sending";
      campaign.sentAt = new Date();
      await campaign.save();

      logger.info(`Campaign sending initiated: ${id}`, {
        userId,
        recipientCount,
      });

      res.json({
        message: "Campaign sending initiated",
        recipientCount,
        status: "sending",
      });
    } catch (error) {
      logger.error("Error sending campaign:", error);
      res.status(500).json({ error: "Failed to send campaign" });
    }
  }

  // Send test email
  async sendTestEmail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { testEmail } = req.body;
      const userId = req.user?._id;

      if (!testEmail || !emailService.validateEmail(testEmail)) {
        res.status(400).json({ error: "Valid test email required" });
        return;
      }

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      await emailService.sendEmail({
        to: testEmail,
        subject: `[TEST] ${campaign.subject}`,
        html: campaign.htmlContent,
        text: campaign.textContent,
      });

      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      logger.error("Error sending test email:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  }

  // Pause campaign
  async pauseCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      if (campaign.status !== "sending") {
        res.status(400).json({ error: "Campaign is not currently sending" });
        return;
      }

      await emailQueueService.pauseCampaign(id);

      campaign.status = "paused";
      await campaign.save();

      res.json({ message: "Campaign paused successfully" });
    } catch (error) {
      logger.error("Error pausing campaign:", error);
      res.status(500).json({ error: "Failed to pause campaign" });
    }
  }

  // Get campaign analytics
  async getCampaignAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      // Get detailed tracking data
      const trackingData = await EmailTracking.aggregate([
        { $match: { campaignId: id } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            emails: { $push: "$contactId" },
          },
        },
      ]);

      // Get open/click timeline
      const timeline = await EmailTracking.aggregate([
        { $match: { campaignId: id, $or: [{ openedAt: { $exists: true } }, { clickedAt: { $exists: true } }] } },
        {
          $project: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d %H:00",
                date: { $ifNull: ["$openedAt", "$clickedAt"] },
              },
            },
            type: { $cond: { if: "$openedAt", then: "open", else: "click" } },
          },
        },
        { $group: { _id: { date: "$date", type: "$type" }, count: { $sum: 1 } } },
        { $sort: { "_id.date": 1 } },
      ]);

      const analytics = {
        campaign: campaign.toObject(),
        tracking: trackingData,
        timeline,
        deliverabilityScore: campaign.spamScore ? 10 - campaign.spamScore : 8,
      };

      res.json(analytics);
    } catch (error) {
      logger.error("Error fetching campaign analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  }

  // Update campaign
  async updateCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      if (campaign.status === "sending") {
        res.status(400).json({ error: "Cannot update campaign while sending" });
        return;
      }

      // Check spam score if content changed
      const { subject, htmlContent } = req.body;
      if (subject || htmlContent) {
        const newSubject = subject || campaign.subject;
        const newContent = htmlContent || campaign.htmlContent;
        const spamScore = await emailService.checkSpamScore(newContent, newSubject);

        if (spamScore > 7) {
          res.status(400).json({
            error: "Updated content has high spam score",
            spamScore,
          });
          return;
        }
        req.body.spamScore = spamScore;
      }

      const updatedCampaign = await Campaign.findByIdAndUpdate(id, { ...req.body, updatedAt: new Date() }, { new: true });

      logger.info(`Campaign updated: ${id}`, { userId });
      res.json(updatedCampaign);
    } catch (error) {
      logger.error("Error updating campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  }

  // Delete campaign
  async deleteCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      if (campaign.status === "sending") {
        // Pause campaign first
        await emailQueueService.pauseCampaign(id);
      }

      // Delete tracking records
      await EmailTracking.deleteMany({ campaignId: id });

      // Delete campaign
      await Campaign.findByIdAndDelete(id);

      logger.info(`Campaign deleted: ${id}`, { userId });
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      logger.error("Error deleting campaign:", error);
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  }

  // Resume campaign
  async resumeCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      if (campaign.status !== "paused") {
        res.status(400).json({ error: "Campaign is not paused" });
        return;
      }

      // Resume sending by re-queuing remaining recipients
      await emailQueueService.sendCampaign(id, userId);

      campaign.status = "sending";
      await campaign.save();

      logger.info(`Campaign resumed: ${id}`, { userId });
      res.json({ message: "Campaign resumed successfully" });
    } catch (error) {
      logger.error("Error resuming campaign:", error);
      res.status(500).json({ error: "Failed to resume campaign" });
    }
  }

  // Duplicate campaign
  async duplicateCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const originalCampaign = await Campaign.findOne({ _id: id, userId });
      if (!originalCampaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      const duplicatedData = {
        ...originalCampaign.toObject(),
        _id: undefined,
        name: `${originalCampaign.name} (Copy)`,
        status: "draft",
        sentAt: undefined,
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          complained: 0,
          totalRecipients: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const duplicatedCampaign = new Campaign(duplicatedData);
      await duplicatedCampaign.save();

      logger.info(`Campaign duplicated: ${id} -> ${duplicatedCampaign._id}`, { userId });
      res.status(201).json(duplicatedCampaign);
    } catch (error) {
      logger.error("Error duplicating campaign:", error);
      res.status(500).json({ error: "Failed to duplicate campaign" });
    }
  }

  // Bulk delete campaigns
  async bulkDeleteCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignIds } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      if (!Array.isArray(campaignIds) || campaignIds.length === 0) {
        res.status(400).json({ error: "Campaign IDs array required" });
        return;
      }

      // Check if campaigns belong to user
      const campaigns = await Campaign.find({
        _id: { $in: campaignIds },
        userId,
      });

      if (campaigns.length !== campaignIds.length) {
        res.status(404).json({ error: "Some campaigns not found" });
        return;
      }

      // Pause any sending campaigns
      const sendingCampaigns = campaigns.filter((c: any) => c.status === "sending");
      for (const campaign of sendingCampaigns) {
        await emailQueueService.pauseCampaign((campaign as any)._id.toString());
      }

      // Delete tracking records
      await EmailTracking.deleteMany({
        campaignId: { $in: campaignIds },
      });

      // Delete campaigns
      await Campaign.deleteMany({
        _id: { $in: campaignIds },
        userId,
      });

      logger.info(`Bulk delete campaigns: ${campaignIds.length}`, { userId, campaignIds });
      res.json({
        message: `${campaignIds.length} campaigns deleted successfully`,
        deletedCount: campaignIds.length,
      });
    } catch (error) {
      logger.error("Error bulk deleting campaigns:", error);
      res.status(500).json({ error: "Failed to delete campaigns" });
    }
  }

  // Bulk send campaigns
  async bulkSendCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignIds } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      if (!Array.isArray(campaignIds) || campaignIds.length === 0) {
        res.status(400).json({ error: "Campaign IDs array required" });
        return;
      }

      // Check campaigns exist and are sendable
      const campaigns = await Campaign.find({
        _id: { $in: campaignIds },
        userId,
        status: { $in: ["draft", "paused"] },
      });

      if (campaigns.length === 0) {
        res.status(404).json({ error: "No sendable campaigns found" });
        return;
      }

      const results = [];
      for (const campaign of campaigns) {
        const campaignId = (campaign as any)._id.toString();
        try {
          await emailQueueService.sendCampaign(campaignId, userId);
          campaign.status = "sending";
          campaign.sentAt = new Date();
          await campaign.save();

          results.push({
            campaignId,
            name: campaign.name,
            status: "queued",
          });
        } catch (error) {
          results.push({
            campaignId,
            name: campaign.name,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      logger.info(`Bulk send campaigns: ${results.length}`, { userId, results });
      res.json({
        message: `${results.filter((r) => r.status === "queued").length} campaigns queued for sending`,
        results,
      });
    } catch (error) {
      logger.error("Error bulk sending campaigns:", error);
      res.status(500).json({ error: "Failed to send campaigns" });
    }
  }

  // Get queue status
  async getQueueStatus(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await emailQueueService.getQueueStats();
      res.json(stats);
    } catch (error) {
      logger.error("Error fetching queue status:", error);
      res.status(500).json({ error: "Failed to fetch queue status" });
    }
  }

  /**
   * Get past campaign subjects for a specific property
   * GET /campaigns/subjects/:propertyId
   * PUBLIC - No authentication required
   */
  async getPropertySubjects(req: Request, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;

      if (!propertyId) {
        res.status(400).json({ error: "Property ID is required" });
        return;
      }

      // Find ALL campaigns where:
      // - type is "single"
      // - property matches propertyId (handle both string and array)
      // - subject exists and is not empty
      const campaigns = await Campaign.find({
        type: "single",
        $or: [{ property: propertyId }, { property: { $in: [propertyId] } }],
        subject: { $exists: true, $ne: "" },
      })
        .select("name subject")
        .sort({ createdAt: -1 })
        .lean();

      // Transform to desired format
      const subjects = campaigns.map((campaign) => ({
        title: campaign.name || "Untitled Campaign",
        subject: campaign.subject,
      }));

      // Remove duplicates based on subject
      const uniqueSubjects = subjects.filter((item, index, self) => index === self.findIndex((t) => t.subject === item.subject));

      logger.info(`Retrieved ${uniqueSubjects.length} unique subjects for property ${propertyId}`);

      res.json({
        success: true,
        propertyId,
        subjects: uniqueSubjects,
        count: uniqueSubjects.length,
      });
    } catch (error) {
      logger.error("Error fetching property subjects:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch campaign subjects",
      });
    }
  }
}

export const campaignController = new CampaignController();
