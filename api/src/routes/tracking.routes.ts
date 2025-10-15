// api/src/routes/tracking.routes.ts
import { Router, Request, Response } from "express";
import { Campaign } from "../models/Campaign";
import { Contact } from "../models/Contact.model";
import { emailStatusManager } from "../services/tracking/EmailStatusManager";
import { metricsAggregator } from "../services/tracking/MetricsAggregator";
import { trackingSyncService } from "../services/tracking/TrackingSyncService";
import { webhookProcessor } from "../services/tracking/WebhookProcessor";
import { authenticate } from "../middleware/auth.middleware";
import { logger } from "../utils/logger";
import { EmailTracking, IEmailTracking, ILinkMetadata } from "../models/EmailTracking.model";
import { getContactsByEmailStatus, getContactsBySpecificStatus } from "../controllers/tracking.controller";

const router = Router();

function calculateClickMetrics(tracking: IEmailTracking) {
  const totalClicks = tracking.linkClicks.length;
  const totalLinks = tracking.links.length;
  const linksWithClicks = tracking.linkStats.size;

  // Find most clicked link
  let mostClickedLink = "";
  let maxClicks = 0;

  for (const [linkId, stats] of tracking.linkStats) {
    if (stats.clickCount > maxClicks) {
      maxClicks = stats.clickCount;
      const link = tracking.links.find((l: ILinkMetadata) => l.linkId === linkId);
      mostClickedLink = link?.linkText || linkId;
    }
  }

  return {
    totalClicks,
    avgClicksPerLink: totalLinks > 0 ? totalClicks / totalLinks : 0,
    clickThroughRate: totalLinks > 0 ? (linksWithClicks / totalLinks) * 100 : 0,
    mostClickedLink,
    hasNewClicker: tracking.linkClicks.length === 1,
  };
}
// Get tracking status
router.get("/:trackingId/status", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;
    const tracking = await EmailTracking.findOne({ trackingId });

    if (!tracking) {
      res.status(404).json({ error: "Tracking record not found" });
      return;
    }

    const history = await emailStatusManager.getStatusHistory(trackingId);

    res.json({
      current: {
        status: tracking.status,
        updatedAt: tracking.updatedAt,
      },
      history,
    });
  } catch (error) {
    logger.error("Error fetching tracking status:", error);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// Update tracking status manually
router.put("/:trackingId/status", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;
    const { status, reason } = req.body;

    const result = await emailStatusManager.updateStatus(trackingId, status, {
      source: "manual",
      reason,
      timestamp: new Date(),
    });

    res.json(result);
  } catch (error) {
    logger.error("Error updating tracking status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Get campaign metrics
router.get("/campaign/:campaignId/metrics", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const metrics = await metricsAggregator.calculateCampaignMetrics(campaignId);
    const realtime = await metricsAggregator.getRealtimeMetrics(campaignId);

    res.json({
      metrics,
      realtime,
    });
  } catch (error) {
    logger.error("Error fetching campaign metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// Webhook endpoints
router.post("/webhooks/:provider", async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    const signature = req.headers["x-webhook-signature"] as string;

    const result = await webhookProcessor.processWebhook(provider, req.body, signature);

    res.json(result);
  } catch (error) {
    logger.error(`Webhook processing failed for ${req.params.provider}:`, error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Sync status
router.get("/sync/status", authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await trackingSyncService.getQueueStats();
    res.json(stats);
  } catch (error) {
    logger.error("Error fetching sync status:", error);
    res.status(500).json({ error: "Failed to fetch sync status" });
  }
});

// Unsubscribe endpoint
router.get("/unsubscribe", async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      res.status(400).send("Invalid unsubscribe link");
      return;
    }

    // Decode token
    const decoded = Buffer.from(token, "base64").toString();
    const [contactId, campaignId] = decoded.split(":");

    // Find and update contact
    const contact = await Contact.findByIdAndUpdate(contactId, {
      subscribed: false,
      unsubscribedAt: new Date(),
      unsubscribeSource: campaignId,
    });

    if (!contact) {
      res.status(404).send("Contact not found");
      return;
    }

    logger.info(`Contact unsubscribed: ${contactId}`, { campaignId });

    // Simple unsubscribe confirmation page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 500px; margin: 0 auto; }
            .success { color: #28a745; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✓ Unsubscribed Successfully</h1>
            <p>You have been unsubscribed from our mailing list.</p>
            <p>Email: ${contact.email}</p>
            <p>If this was a mistake, please contact us.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error("Error processing unsubscribe:", error);
    res.status(500).send("Error processing unsubscribe request");
  }
});

// SendGrid webhook handler
router.post("/webhooks/sendgrid", async (req: Request, res: Response): Promise<void> => {
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      res.status(400).json({ error: "Invalid webhook payload" });
      return;
    }

    for (const event of events) {
      await processWebhookEvent(event);
    }

    res.status(200).send("OK");
  } catch (error) {
    logger.error("Error processing SendGrid webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Process webhook events
async function processWebhookEvent(event: any): Promise<void> {
  try {
    const { event: eventType, email, timestamp, reason, sg_message_id } = event;

    // Find tracking record by message ID
    const tracking = await EmailTracking.findOne({
      messageId: sg_message_id,
    });

    if (!tracking) {
      logger.warn(`Tracking record not found for message: ${sg_message_id}`);
      return;
    }

    switch (eventType) {
      case "delivered":
        tracking.status = "delivered";
        tracking.deliveredAt = new Date(timestamp * 1000);

        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: {
            "metrics.delivered": 1,
            "metrics.successfulDeliveries": 1, // Legacy support
          },
        });
        break;

      case "bounce":
        tracking.status = "bounced";
        tracking.bouncedAt = new Date(timestamp * 1000);
        tracking.bounceReason = reason;

        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: {
            "metrics.bounced": 1,
            "metrics.bounces": 1, // Legacy support
          },
        });
        break;

      case "dropped":
        tracking.status = "failed";
        tracking.error = reason;
        break;

      case "spamreport":
        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: { "metrics.complained": 1 },
        });
        break;

      case "click":
        // Find the link by URL
        const clickedLink = tracking.links.find((link) => link.originalUrl === event.url);

        if (clickedLink) {
          // Add to linkClicks
          tracking.linkClicks.push({
            linkId: clickedLink.linkId,
            clickedAt: new Date(timestamp * 1000),
            ipAddress: event.ip,
            userAgent: event.useragent,
            referer: event.referer || "",
          });

          // Update linkStats
          const linkStat = tracking.linkStats.get(clickedLink.linkId) || {
            clickCount: 0,
            uniqueIPs: [],
            firstClick: undefined,
            lastClick: undefined,
          };

          linkStat.clickCount++;
          linkStat.lastClick = new Date(timestamp * 1000);
          if (!linkStat.firstClick) {
            linkStat.firstClick = new Date(timestamp * 1000);
          }

          if (!linkStat.uniqueIPs.includes(event.ip)) {
            linkStat.uniqueIPs.push(event.ip);
          }

          tracking.linkStats.set(clickedLink.linkId, linkStat);
        }

        // Update overall click status
        if (!tracking.clickedAt) {
          tracking.status = "clicked";
          tracking.clickedAt = new Date(timestamp * 1000);
        }

        // Calculate comprehensive metrics
        const clickMetrics = calculateClickMetrics(tracking);

        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: {
            "metrics.clicked": clickMetrics.hasNewClicker ? 1 : 0,
            "metrics.totalClicks": 1,
          },
          $set: {
            "metrics.avgClicksPerLink": clickMetrics.avgClicksPerLink,
            "metrics.clickThroughRate": clickMetrics.clickThroughRate,
            "metrics.topLink": clickMetrics.mostClickedLink,
          },
        });
        break;
    }

    await tracking.save();

    logger.info(`Webhook event processed: ${eventType}`, {
      messageId: sg_message_id,
      email,
      campaignId: tracking.campaignId,
    });
  } catch (error) {
    logger.error("Error processing webhook event:", error);
  }
}

// Enhanced click tracking with link-specific analytics

router.get("/click/:trackingId/:linkId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId, linkId } = req.params;
    const { url } = req.query;
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "";
    const referer = req.get("Referer") || "";

    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "URL parameter required" });
      return;
    }

    const tracking = await EmailTracking.findOne({ trackingId });

    if (tracking) {
      // Update general click status if first click
      if (!tracking.clickedAt) {
        tracking.status = "clicked";
        tracking.clickedAt = new Date();

        await Campaign.findByIdAndUpdate(tracking.campaignId, {
          $inc: { "metrics.clicked": 1 },
        });
      }

      // Track link-specific click
      tracking.linkClicks.push({
        linkId,
        clickedAt: new Date(),
        ipAddress,
        userAgent,
        referer,
      });

      // FIX: Handle uniqueIPs as an array, not a Set
      const linkStat = tracking.linkStats.get(linkId) || {
        clickCount: 0,
        uniqueIPs: [], // Array, not Set
        firstClick: undefined,
        lastClick: undefined,
      };

      linkStat.clickCount++;
      linkStat.lastClick = new Date();
      if (!linkStat.firstClick) {
        linkStat.firstClick = new Date();
      }

      // FIX: Add IP to array if not already present
      if (!linkStat.uniqueIPs.includes(ipAddress)) {
        linkStat.uniqueIPs.push(ipAddress);
      }

      tracking.linkStats.set(linkId, linkStat);

      await Campaign.findByIdAndUpdate(tracking.campaignId, {
        $inc: { "metrics.totalClicks": 1 },
      });

      await tracking.save();

      logger.info(`Email link clicked: ${trackingId}/${linkId}`, {
        campaignId: tracking.campaignId,
        contactId: tracking.contactId,
        linkId,
        url,
        ipAddress,
      });
    }

    res.redirect(url);
  } catch (error) {
    logger.error("Error tracking click:", error);

    if (req.query.url && typeof req.query.url === "string") {
      res.redirect(req.query.url);
    } else {
      res.status(500).json({ error: "Tracking error" });
    }
  }
});

/**
 * Get all contacts grouped by status
 * GET /api/tracking/contacts/by-status
 * Optional query param: ?campaignId=xxx
 */
router.get("/contacts/by-status", getContactsByEmailStatus);

/**
 * Get contacts for a specific status
 * GET /api/tracking/contacts/by-status/:status
 * Valid statuses: sent, delivered, opened, clicked, bounced
 * Optional query param: ?campaignId=xxx
 */
router.get("/contacts/by-status/:status", getContactsBySpecificStatus);

export default router;
