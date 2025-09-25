// api/src/services/mailcow/mailcowStatus.service.ts
import axios from 'axios';
import { EmailTracking } from '../../models/EmailTracking.model';
import { Campaign } from '../../models/Campaign';
import { logger } from '../../utils/logger';
import { Redis } from 'ioredis';

interface MailcowConfig {
  apiUrl: string;
  apiKey: string;
  logsPerBatch: number;
  syncInterval: number; // in milliseconds
}

interface MailcowLogEntry {
  time: string;
  message: string;
  priority: string;
  program: string;
}

interface ProcessedStatus {
  messageId: string;
  queueId: string;
  status: 'sent' | 'delivered' | 'bounced' | 'deferred' | 'rejected';
  recipient?: string;
  timestamp: Date;
  reason?: string;
  dsn?: string;
}

export class MailcowStatusService {
  private config: MailcowConfig;
  private redis: Redis;
  private isProcessing: boolean = false;
  private lastProcessedTime: number;

  constructor() {
    this.config = {
      apiUrl: process.env.MAILCOW_API_URL || '',
      apiKey: process.env.MAILCOW_API_KEY || '',
      logsPerBatch: parseInt(process.env.MAILCOW_LOGS_PER_BATCH || '100'),
      syncInterval: parseInt(process.env.MAILCOW_SYNC_INTERVAL || '60000'), // 1 minute default
    };

    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.lastProcessedTime = 0;
    this.initializeLastProcessedTime();
  }

  private async initializeLastProcessedTime() {
    const stored = await this.redis.get('mailcow:last_processed_time');
    if (stored) {
      this.lastProcessedTime = parseInt(stored);
    } else {
      // Start from 24 hours ago if no previous time
      this.lastProcessedTime = Date.now() - (24 * 60 * 60 * 1000);
    }
  }

  /**
   * Fetch logs from Mailcow Postfix API
   */
  async fetchLogs(): Promise<MailcowLogEntry[]> {
    try {
      const url = `${this.config.apiUrl}/api/v1/get/logs/postfix/${this.config.logsPerBatch}`;
      const response = await axios.get(url, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
        timeout: 30000,
      });

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      logger.error('Failed to fetch Mailcow logs:', error);
      throw error;
    }
  }

  /**
   * Parse log entry to extract status information
   */
  parseLogEntry(log: MailcowLogEntry): ProcessedStatus | null {
    try {
      const logTime = parseInt(log.time, 10) * 1000; // Convert to milliseconds
      
      // Skip old logs we've already processed
      if (logTime <= this.lastProcessedTime) {
        return null;
      }

      const message = log.message;

      // Extract status
      const statusMatch = message.match(/status=([\w-]+)/);
      const status = statusMatch?.[1];
      if (!status) return null;

      // Extract queue ID
      const queueIdMatch = message.match(/\b[A-F0-9]{10,}\b/);
      const queueId = queueIdMatch?.[0];
      if (!queueId) return null;

      // Extract message ID
      const messageIdMatch = message.match(/message-id=<([^>]+)>/);
      const messageId = messageIdMatch?.[1];
      
      // Extract recipient
      const recipientMatch = message.match(/to=<([^>]+)>/);
      const recipient = recipientMatch?.[1];

      // Extract DSN (Delivery Status Notification) for bounce details
      const dsnMatch = message.match(/dsn=([\d.]+)/);
      const dsn = dsnMatch?.[1];

      // Extract reason for bounce/defer
      let reason: string | undefined;
      if (status === 'bounced' || status === 'deferred') {
        const reasonMatch = message.match(/\((.+)\)$/);
        reason = reasonMatch?.[1];
      }

      // Map Mailcow status to our status
      let mappedStatus: ProcessedStatus['status'];
      switch (status) {
        case 'sent':
          mappedStatus = 'sent';
          break;
        case 'delivered':
          mappedStatus = 'delivered';
          break;
        case 'bounced':
          mappedStatus = 'bounced';
          break;
        case 'deferred':
          mappedStatus = 'deferred';
          break;
        case 'reject':
        case 'rejected':
          mappedStatus = 'rejected';
          break;
        default:
          return null;
      }

      return {
        messageId: messageId || '',
        queueId,
        status: mappedStatus,
        recipient,
        timestamp: new Date(logTime),
        reason,
        dsn,
      };
    } catch (error) {
      logger.error('Error parsing log entry:', error);
      return null;
    }
  }

  /**
   * Process logs and update EmailTracking records
   */
  async processLogs(logs: MailcowLogEntry[]): Promise<{ processed: number; updated: number }> {
    let processed = 0;
    let updated = 0;
    const processedMessageIds = new Set<string>();

    for (const log of logs) {
      const statusInfo = this.parseLogEntry(log);
      if (!statusInfo || !statusInfo.messageId) continue;

      // Skip if we've already processed this message ID in this batch
      if (processedMessageIds.has(statusInfo.messageId)) continue;
      processedMessageIds.add(statusInfo.messageId);

      processed++;

      try {
        // Find the EmailTracking record by messageId
        const tracking = await EmailTracking.findOne({ 
          messageId: statusInfo.messageId 
        });

        if (!tracking) {
          // Try to find by recipient if messageId doesn't match
          if (statusInfo.recipient) {
            const recentTracking = await EmailTracking.findOne({
              'contactEmail': statusInfo.recipient,
              createdAt: { 
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
              }
            }).sort({ createdAt: -1 });

            if (recentTracking && !recentTracking.messageId) {
              // Update the messageId for future reference
              recentTracking.messageId = statusInfo.messageId;
              await recentTracking.save();
              await this.updateTrackingStatus(recentTracking, statusInfo);
              updated++;
            }
          }
          continue;
        }

        await this.updateTrackingStatus(tracking, statusInfo);
        updated++;

      } catch (error) {
        logger.error(`Error updating tracking for messageId ${statusInfo.messageId}:`, error);
      }
    }

    // Update last processed time
    if (logs.length > 0) {
      const latestTime = Math.max(
        ...logs.map(log => parseInt(log.time, 10) * 1000)
      );
      this.lastProcessedTime = latestTime;
      await this.redis.set('mailcow:last_processed_time', latestTime.toString());
    }

    return { processed, updated };
  }

  /**
   * Update EmailTracking and Campaign metrics based on status
   */
  private async updateTrackingStatus(
    tracking: any,
    statusInfo: ProcessedStatus
  ): Promise<void> {
    const previousStatus = tracking.status;
    let shouldUpdateCampaign = false;

    switch (statusInfo.status) {
      case 'delivered':
        if (tracking.status !== 'delivered' && tracking.status !== 'clicked' && tracking.status !== 'opened') {
          tracking.status = 'delivered';
          tracking.deliveredAt = statusInfo.timestamp;
          shouldUpdateCampaign = true;
        }
        break;

      case 'bounced':
        tracking.status = 'bounced';
        tracking.bouncedAt = statusInfo.timestamp;
        tracking.bounceReason = statusInfo.reason || 'Unknown';
        tracking.bounceType = this.categorizeBounce(statusInfo.dsn, statusInfo.reason);
        shouldUpdateCampaign = true;
        break;

      case 'deferred':
        // Don't change status to deferred if already delivered/opened/clicked
        if (!['delivered', 'opened', 'clicked', 'bounced'].includes(tracking.status)) {
          tracking.error = `Deferred: ${statusInfo.reason || 'Temporary delivery issue'}`;
          // Don't change status for deferred - it might succeed later
        }
        break;

      case 'rejected':
        tracking.status = 'failed';
        tracking.error = `Rejected: ${statusInfo.reason || 'Message rejected by server'}`;
        shouldUpdateCampaign = true;
        break;
    }

    await tracking.save();

    // Update campaign metrics
    if (shouldUpdateCampaign && tracking.campaignId) {
      await this.updateCampaignMetrics(
        tracking.campaignId,
        statusInfo.status,
        previousStatus
      );
    }
  }

  /**
   * Categorize bounce type based on DSN code and reason
   */
  private categorizeBounce(dsn?: string, reason?: string): 'hard' | 'soft' | 'unknown' {
    if (dsn) {
      // DSN codes: 5.x.x = permanent (hard), 4.x.x = temporary (soft)
      if (dsn.startsWith('5')) return 'hard';
      if (dsn.startsWith('4')) return 'soft';
    }

    if (reason) {
      const lowerReason = reason.toLowerCase();
      
      // Hard bounce indicators
      if (
        lowerReason.includes('user unknown') ||
        lowerReason.includes('no such user') ||
        lowerReason.includes('address rejected') ||
        lowerReason.includes('domain not found') ||
        lowerReason.includes('invalid recipient')
      ) {
        return 'hard';
      }

      // Soft bounce indicators
      if (
        lowerReason.includes('mailbox full') ||
        lowerReason.includes('over quota') ||
        lowerReason.includes('temporarily') ||
        lowerReason.includes('try again') ||
        lowerReason.includes('connection timed out')
      ) {
        return 'soft';
      }
    }

    return 'unknown';
  }

  /**
   * Update campaign metrics based on status changes
   */
  private async updateCampaignMetrics(
    campaignId: string,
    newStatus: string,
    previousStatus: string
  ): Promise<void> {
    try {
      const updates: any = {};

      // Increment new status
      switch (newStatus) {
        case 'delivered':
          if (previousStatus !== 'delivered') {
            updates['metrics.delivered'] = 1;
            updates['metrics.successfulDeliveries'] = 1;
          }
          break;
        case 'bounced':
          updates['metrics.bounced'] = 1;
          updates['metrics.bounces'] = 1;
          break;
        case 'rejected':
        case 'failed':
          updates['metrics.failed'] = 1;
          break;
      }

      // Decrement previous status if necessary
      if (previousStatus === 'sent' && newStatus === 'delivered') {
        updates['metrics.sent'] = -1;
      }

      if (Object.keys(updates).length > 0) {
        await Campaign.findByIdAndUpdate(campaignId, { $inc: updates });
        
        logger.info(`Campaign metrics updated`, {
          campaignId,
          newStatus,
          previousStatus,
          updates
        });
      }
    } catch (error) {
      logger.error(`Error updating campaign metrics:`, error);
    }
  }

  /**
   * Main sync method to be called periodically
   */
  async syncStatuses(): Promise<{ success: boolean; processed: number; updated: number; error?: string }> {
    if (this.isProcessing) {
      logger.info('Sync already in progress, skipping...');
      return { success: false, processed: 0, updated: 0, error: 'Sync already in progress' };
    }

    this.isProcessing = true;

    try {
      logger.info('Starting Mailcow status sync...');
      
      const logs = await this.fetchLogs();
      logger.info(`Fetched ${logs.length} log entries from Mailcow`);
      
      const result = await this.processLogs(logs);
      
      logger.info(`Mailcow sync completed`, {
        processed: result.processed,
        updated: result.updated
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Mailcow sync failed:', errorMessage);
      return {
        success: false,
        processed: 0,
        updated: 0,
        error: errorMessage
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start automatic syncing
   */
  startAutoSync(): void {
    logger.info(`Starting Mailcow auto-sync with interval: ${this.config.syncInterval}ms`);
    
    // Initial sync
    this.syncStatuses();
    
    // Schedule periodic syncs
    setInterval(() => {
      this.syncStatuses();
    }, this.config.syncInterval);
  }

  /**
   * Get sync status and statistics
   */
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
      }
    };
  }
}

export const mailcowStatusService = new MailcowStatusService();