// api/src/services/mailcow/mailcowStatus.service.ts - COMPLETE FIXED VERSION
import axios from "axios";
import { EmailTracking } from "../../models/EmailTracking.model";
import { Campaign } from "../../models/Campaign";
import { logger } from "../../utils/logger";
import { Redis } from "ioredis";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

interface MailcowConfig {
  apiUrl: string;
  apiKey: string;
  logsPerBatch: number;
  syncInterval: number;
}

interface MailcowLogEntry {
  time: string;
  message: string;
  priority: string;
  program: string;
}

interface ProcessedStatus {
  messageId?: string;
  queueId?: string;
  status: "sent" | "delivered" | "bounced" | "deferred" | "rejected" | "queued";
  recipient?: string;
  timestamp: Date;
  reason?: string;
  dsn?: string;
  from?: string;
}

export class MailcowStatusService {
  private config: MailcowConfig;
  private redis: Redis;
  private isProcessing: boolean = false;
  private lastProcessedTime: number;
  private queueIdToMessageId: Map<string, string> = new Map();

  constructor() {
    // Load environment variables
    const apiUrl = process.env.MAILCOW_API_URL || "";
    const apiKey = process.env.MAILCOW_API_KEY || "";

    this.config = {
      apiUrl: apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl,
      apiKey: apiKey,
      logsPerBatch: parseInt(process.env.MAILCOW_LOGS_PER_BATCH || "500"), // Increased for better coverage
      syncInterval: parseInt(process.env.MAILCOW_SYNC_INTERVAL || "60000"),
    };

    logger.info("Mailcow service initialized with config:", {
      apiUrl: this.config.apiUrl,
      hasApiKey: !!this.config.apiKey,
      logsPerBatch: this.config.logsPerBatch,
    });

    if (!this.config.apiUrl || !this.config.apiKey) {
      logger.error("Mailcow configuration missing!", {
        apiUrl: this.config.apiUrl,
        hasKey: !!this.config.apiKey,
      });
    }

    this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    this.lastProcessedTime = 0;
    this.initializeLastProcessedTime();
  }

  private async initializeLastProcessedTime() {
    const stored = await this.redis.get("mailcow:last_processed_time");
    if (stored) {
      this.lastProcessedTime = parseInt(stored);
    } else {
      // Start from 24 hours ago
      this.lastProcessedTime = Date.now() - 24 * 60 * 60 * 1000;
    }
  }

  async fetchLogs(): Promise<MailcowLogEntry[]> {
    try {
      if (!this.config.apiUrl || !this.config.apiKey) {
        throw new Error(
          `Mailcow not configured: URL="${this.config.apiUrl}" Key="${this.config.apiKey ? "SET" : "MISSING"}"`
        );
      }

      const fullUrl = `${this.config.apiUrl}/api/v1/get/logs/postfix/${this.config.logsPerBatch}`;

      logger.info("Fetching from Mailcow:", { url: fullUrl });

      const response = await axios.get(fullUrl, {
        headers: {
          "X-API-Key": this.config.apiKey,
        },
        timeout: 30000,
      });

      if (response.data && Array.isArray(response.data)) {
        logger.info(`Fetched ${response.data.length} log entries`);
        return response.data;
      }
      return [];
    } catch (error: any) {
      logger.error("Mailcow fetch failed:", {
        message: error.message,
        config: this.config.apiUrl,
        code: error.code,
        url: error.config?.url,
      });
      throw error;
    }
  }

  parseLogEntry(log: MailcowLogEntry): ProcessedStatus | null {
    try {
      const logTime = parseInt(log.time, 10) * 1000;

      // Skip old logs
      if (logTime <= this.lastProcessedTime) {
        return null;
      }

      const message = log.message;

      // PATTERN 1: Queue ID with message-id mapping
      // Example: "Sep 26 21:08:26 mail postfix/cleanup[1234]: 3F4D5E6: message-id=<1758920900603-z49c4w6g8@mailivo.com>"
      const queueMessageMatch = message.match(
        /([A-F0-9]{8,12}):\s+message-id=<([^>]+)>/
      );
      if (queueMessageMatch) {
        const [, queueId, messageId] = queueMessageMatch;
        this.queueIdToMessageId.set(queueId, `<${messageId}>`);
        logger.info(`Mapped queue ${queueId} to message-id <${messageId}>`);
        return null; // Just store mapping, don't process as status
      }

      // PATTERN 2: Status with queue ID
      // Example: "Sep 26 21:08:26 mail postfix/smtp[1234]: 3F4D5E6: to=<recipient@example.com>, relay=mx.example.com[1.2.3.4]:25, delay=0.5, delays=0.1/0/0.2/0.2, dsn=2.0.0, status=sent (250 2.0.0 Ok: queued as ABCDEF)"
      const queueIdMatch = message.match(/([A-F0-9]{8,12}):/);
      const queueId = queueIdMatch?.[1];

      const statusMatch = message.match(/\bstatus=([\w-]+)/);
      const status = statusMatch?.[1];

      if (!queueId || !status) {
        return null;
      }

      // Extract recipient
      const recipientMatch = message.match(/to=<([^>]+)>/);
      const recipient = recipientMatch?.[1]?.toLowerCase();

      // Extract from address
      const fromMatch = message.match(/from=<([^>]+)>/);
      const from = fromMatch?.[1]?.toLowerCase();

      // Extract DSN code
      const dsnMatch = message.match(/dsn=([\d.]+)/);
      const dsn = dsnMatch?.[1];

      // Extract reason for bounces/deferrals
      let reason: string | undefined;
      if (
        status === "bounced" ||
        status === "deferred" ||
        status === "reject"
      ) {
        const reasonMatch = message.match(/\((.+)\)$/);
        reason = reasonMatch?.[1];
      }

      // Map status to our internal status
      let mappedStatus: ProcessedStatus["status"];
      switch (status) {
        case "sent":
          // Check if DSN indicates actual delivery
          if (dsn && dsn.startsWith("2.")) {
            mappedStatus = "delivered";
          } else {
            mappedStatus = "sent";
          }
          break;
        case "delivered":
          mappedStatus = "delivered";
          break;
        case "bounced":
          mappedStatus = "bounced";
          break;
        case "deferred":
          mappedStatus = "deferred";
          break;
        case "reject":
        case "rejected":
          mappedStatus = "rejected";
          break;
        default:
          return null;
      }

      // Try to get message ID from our mapping
      const messageId = this.queueIdToMessageId.get(queueId);

      return {
        messageId,
        queueId,
        status: mappedStatus,
        recipient,
        from,
        timestamp: new Date(logTime),
        reason,
        dsn,
      };
    } catch (error) {
      logger.error("Error parsing log:", error);
      return null;
    }
  }

  async processLogs(
    logs: MailcowLogEntry[]
  ): Promise<{ processed: number; updated: number; matchedByEmail: number }> {
    let processed = 0;
    let updated = 0;
    let matchedByEmail = 0;

    // First pass: Build queue ID to message ID mapping
    for (const log of logs) {
      const message = log.message;
      const queueMessageMatch = message.match(
        /([A-F0-9]{8,12}):\s+message-id=<([^>]+)>/
      );
      if (queueMessageMatch) {
        const [, queueId, messageId] = queueMessageMatch;
        this.queueIdToMessageId.set(queueId, `<${messageId}>`);
        logger.debug(`Mapped queue ${queueId} to <${messageId}>`);
      }
    }

    // Second pass: Process status updates
    for (const log of logs) {
      const statusInfo = this.parseLogEntry(log);
      if (!statusInfo) continue;

      processed++;

      try {
        let trackingRecord = null;

        // Try to find by message ID first
        if (statusInfo.messageId) {
          trackingRecord = await EmailTracking.findOne({
            messageId: statusInfo.messageId,
          });

          if (trackingRecord) {
            logger.info(`Found tracking by messageId: ${statusInfo.messageId}`);
          }
        }

        // If not found by message ID, try by recipient email
        if (!trackingRecord && statusInfo.recipient) {
          trackingRecord = await EmailTracking.findOne({
            contactEmail: statusInfo.recipient,
            // Look for recent emails (last 24 hours)
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          }).sort({ createdAt: -1 });

          if (trackingRecord) {
            matchedByEmail++;
            logger.info(`Found tracking by email: ${statusInfo.recipient}`);

            // Update the message ID if we now know it
            if (statusInfo.messageId && !trackingRecord.messageId) {
              trackingRecord.messageId = statusInfo.messageId;
            }
          }
        }

        if (trackingRecord) {
          const currentStatus = trackingRecord.status;
          let shouldUpdate = false;

          // Update based on status precedence
          if (
            statusInfo.status === "delivered" &&
            currentStatus !== "delivered"
          ) {
            trackingRecord.status = "delivered";
            trackingRecord.deliveredAt = statusInfo.timestamp;
            shouldUpdate = true;
            logger.info(`Marking as delivered: ${trackingRecord.contactEmail}`);
          } else if (
            statusInfo.status === "bounced" &&
            currentStatus !== "bounced"
          ) {
            trackingRecord.status = "bounced";
            trackingRecord.bouncedAt = statusInfo.timestamp;
            trackingRecord.bounceReason = statusInfo.reason;
            trackingRecord.dsn = statusInfo.dsn; // Changed from bounceDsn to dsn
            shouldUpdate = true;
            logger.info(`Marking as bounced: ${trackingRecord.contactEmail}`);
          } else if (
            statusInfo.status === "deferred" &&
            currentStatus === "sent"
          ) {
            // Don't change status for deferred, just log the error
            trackingRecord.error = `Deferred: ${statusInfo.reason || "Temporary delivery issue"}`;
            shouldUpdate = true;
            logger.info(
              `Email deferred: ${trackingRecord.contactEmail}, reason: ${statusInfo.reason}`
            );
          }

          if (shouldUpdate) {
            await trackingRecord.save();
            updated++;

            // Update campaign metrics
            await this.updateCampaignMetrics(
              trackingRecord.campaignId.toString()
            );
          }
        } else {
          logger.debug(
            `No tracking record found for: ${statusInfo.recipient || statusInfo.messageId}`
          );
        }
      } catch (error) {
        logger.error("Error updating tracking record:", error);
      }
    }

    // Update last processed time
    if (logs.length > 0) {
      const latestTime = Math.max(
        ...logs.map((l) => parseInt(l.time, 10) * 1000)
      );
      this.lastProcessedTime = latestTime;
      await this.redis.set(
        "mailcow:last_processed_time",
        latestTime.toString()
      );
    }

    return { processed, updated, matchedByEmail };
  }

  async updateCampaignMetrics(campaignId: string): Promise<void> {
    try {
      const metrics = await EmailTracking.aggregate([
        { $match: { campaignId: campaignId } },
        {
          $group: {
            _id: null,
            sent: { $sum: { $cond: [{ $ne: ["$status", "pending"] }, 1, 0] } },
            delivered: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            bounced: {
              $sum: { $cond: [{ $eq: ["$status", "bounced"] }, 1, 0] },
            },
            failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
            clicked: {
              $sum: { $cond: [{ $eq: ["$status", "clicked"] }, 1, 0] },
            },
          },
        },
      ]);

      if (metrics.length > 0) {
        await Campaign.findByIdAndUpdate(campaignId, {
          $set: {
            "metrics.sent": metrics[0].sent,
            "metrics.delivered": metrics[0].delivered,
            "metrics.bounced": metrics[0].bounced,
            "metrics.failed": metrics[0].failed,
            "metrics.clicked": metrics[0].clicked,
          },
        });

        logger.info(`Updated campaign metrics for ${campaignId}:`, metrics[0]);
      }
    } catch (error) {
      logger.error(
        `Failed to update campaign metrics for ${campaignId}:`,
        error
      );
    }
  }

  async syncStatuses(): Promise<{
    success: boolean;
    processed: number;
    updated: number;
    matchedByEmail?: number;
    error?: string;
  }> {
    if (this.isProcessing) {
      logger.info("Sync already in progress, skipping...");
      return {
        success: false,
        processed: 0,
        updated: 0,
        error: "Already processing",
      };
    }

    if (!this.config.apiUrl || !this.config.apiKey) {
      logger.error("Mailcow not configured, skipping sync");
      return {
        success: false,
        processed: 0,
        updated: 0,
        error: "Not configured",
      };
    }

    this.isProcessing = true;
    logger.info("Starting Mailcow status sync...");

    try {
      const logs = await this.fetchLogs();
      logger.info(`Fetched ${logs.length} log entries`);

      const result = await this.processLogs(logs);

      logger.info("Mailcow sync completed", result);

      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      const errorMessage = error?.message ? error.message : "Unknown error";
      logger.error("Mailcow sync failed:", errorMessage);
      return {
        success: false,
        processed: 0,
        updated: 0,
        error: errorMessage,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  startAutoSync(): void {
    if (process.env.MAILCOW_SYNC_ENABLED !== "true") {
      logger.info("Mailcow sync disabled by configuration");
      return;
    }

    logger.info(`Starting auto-sync: ${this.config.syncInterval}ms`);

    // Initial sync
    this.syncStatuses();

    // Schedule periodic syncs
    setInterval(() => {
      this.syncStatuses();
    }, this.config.syncInterval);
  }

  async getSyncStatus(): Promise<{
    lastSync: number;
    isProcessing: boolean;
    config: Partial<MailcowConfig>;
  }> {
    return {
      lastSync: this.lastProcessedTime,
      isProcessing: this.isProcessing,
      config: {
        apiUrl: this.config.apiUrl,
        logsPerBatch: this.config.logsPerBatch,
        syncInterval: this.config.syncInterval,
      },
    };
  }
}

export const mailcowStatusService = new MailcowStatusService();
