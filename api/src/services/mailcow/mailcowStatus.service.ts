// api/src/services/mailcow/mailcowStatus.service.ts - COMPLETE FIXED VERSION
import axios from 'axios';
import { EmailTracking } from '../../models/EmailTracking.model';
import { Campaign } from '../../models/Campaign';
import { logger } from '../../utils/logger';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';

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
    // Load environment variables
    const apiUrl = process.env.MAILCOW_API_URL || '';
    const apiKey = process.env.MAILCOW_API_KEY || '';
    
    this.config = {
      apiUrl: apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl,
      apiKey: apiKey,
      logsPerBatch: parseInt(process.env.MAILCOW_LOGS_PER_BATCH || '100'),
      syncInterval: parseInt(process.env.MAILCOW_SYNC_INTERVAL || '60000'),
    };

    logger.info('Mailcow service initialized with config:', {
      apiUrl: this.config.apiUrl,
      hasApiKey: !!this.config.apiKey,
      logsPerBatch: this.config.logsPerBatch
    });

    if (!this.config.apiUrl || !this.config.apiKey) {
      logger.error('Mailcow configuration missing!', {
        apiUrl: this.config.apiUrl,
        hasKey: !!this.config.apiKey
      });
    }

    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.lastProcessedTime = 0;
    this.initializeLastProcessedTime();
  }

  private async initializeLastProcessedTime() {
    const stored = await this.redis.get('mailcow:last_processed_time');
    if (stored) {
      this.lastProcessedTime = parseInt(stored);
    } else {
      this.lastProcessedTime = Date.now() - (24 * 60 * 60 * 1000);
    }
  }

  async fetchLogs(): Promise<MailcowLogEntry[]> {
    try {
      if (!this.config.apiUrl || !this.config.apiKey) {
        throw new Error(`Mailcow not configured: URL="${this.config.apiUrl}" Key="${this.config.apiKey ? 'SET' : 'MISSING'}"`);
      }
      
      const fullUrl = `${this.config.apiUrl}/api/v1/get/logs/postfix/${this.config.logsPerBatch}`;
      
      logger.info('Fetching from Mailcow:', { url: fullUrl });
      
      const response = await axios.get(fullUrl, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
        timeout: 30000,
      });

      if (response.data && Array.isArray(response.data)) {
        logger.info(`Fetched ${response.data.length} log entries`);
        return response.data;
      }
      return [];
    } catch (error: any) {
      logger.error('Mailcow fetch failed:', {
        message: error.message,
        config: this.config.apiUrl,
        code: error.code,
        url: error.config?.url
      });
      throw error;
    }
  }

  parseLogEntry(log: MailcowLogEntry): ProcessedStatus | null {
    try {
      const logTime = parseInt(log.time, 10) * 1000;
      
      if (logTime <= this.lastProcessedTime) {
        return null;
      }

      const message = log.message;
      const statusMatch = message.match(/status=([\w-]+)/);
      const status = statusMatch?.[1];
      if (!status) return null;

      const queueIdMatch = message.match(/\b[A-F0-9]{10,}\b/);
      const queueId = queueIdMatch?.[0];
      if (!queueId) return null;

      const messageIdMatch = message.match(/message-id=<([^>]+)>/);
      const messageId = messageIdMatch?.[1];
      
      const recipientMatch = message.match(/to=<([^>]+)>/);
      const recipient = recipientMatch?.[1];

      const dsnMatch = message.match(/dsn=([\d.]+)/);
      const dsn = dsnMatch?.[1];

      let reason: string | undefined;
      if (status === 'bounced' || status === 'deferred') {
        const reasonMatch = message.match(/\((.+)\)$/);
        reason = reasonMatch?.[1];
      }

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
      logger.error('Error parsing log:', error);
      return null;
    }
  }

  async processLogs(logs: MailcowLogEntry[]): Promise<{ processed: number; updated: number }> {
    let processed = 0;
    let updated = 0;
    const processedMessageIds = new Set<string>();

    for (const log of logs) {
      const statusInfo = this.parseLogEntry(log);
      if (!statusInfo || !statusInfo.messageId) continue;

      if (processedMessageIds.has(statusInfo.messageId)) continue;
      processedMessageIds.add(statusInfo.messageId);

      processed++;

      try {
        const tracking = await EmailTracking.findOne({ 
          messageId: statusInfo.messageId 
        });

        if (!tracking) {
          if (statusInfo.recipient) {
            const recentTracking = await EmailTracking.findOne({
              contactEmail: statusInfo.recipient,
              createdAt: { 
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            }).sort({ createdAt: -1 });

            if (recentTracking && !recentTracking.messageId) {
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
        logger.error(`Error updating ${statusInfo.messageId}:`, error);
      }
    }

    if (logs.length > 0) {
      const latestTime = Math.max(
        ...logs.map(log => parseInt(log.time, 10) * 1000)
      );
      this.lastProcessedTime = latestTime;
      await this.redis.set('mailcow:last_processed_time', latestTime.toString());
    }

    return { processed, updated };
  }

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
        if (!['delivered', 'opened', 'clicked', 'bounced'].includes(tracking.status)) {
          tracking.error = `Deferred: ${statusInfo.reason || 'Temporary delivery issue'}`;
        }
        break;

      case 'rejected':
        tracking.status = 'failed';
        tracking.error = `Rejected: ${statusInfo.reason || 'Message rejected by server'}`;
        shouldUpdateCampaign = true;
        break;
    }

    await tracking.save();

    if (shouldUpdateCampaign && tracking.campaignId) {
      await this.updateCampaignMetrics(
        tracking.campaignId,
        statusInfo.status,
        previousStatus
      );
    }
  }

  private categorizeBounce(dsn?: string, reason?: string): 'hard' | 'soft' | 'unknown' {
    if (dsn) {
      if (dsn.startsWith('5')) return 'hard';
      if (dsn.startsWith('4')) return 'soft';
    }

    if (reason) {
      const lowerReason = reason.toLowerCase();
      
      if (
        lowerReason.includes('user unknown') ||
        lowerReason.includes('no such user') ||
        lowerReason.includes('address rejected') ||
        lowerReason.includes('domain not found') ||
        lowerReason.includes('invalid recipient')
      ) {
        return 'hard';
      }

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

  private async updateCampaignMetrics(
    campaignId: string,
    newStatus: string,
    previousStatus: string
  ): Promise<void> {
    try {
      const updates: any = {};

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
          updates['metrics.bounced'] = 1;
          updates['metrics.bounces'] = 1;
          break;
      }

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

  async syncStatuses(): Promise<{ success: boolean; processed: number; updated: number; error?: string }> {
    if (this.isProcessing) {
      logger.info('Sync already in progress');
      return { success: false, processed: 0, updated: 0, error: 'Sync already in progress' };
    }

    this.isProcessing = true;

    try {
      logger.info('Starting Mailcow status sync...');
      
      const logs = await this.fetchLogs();
      logger.info(`Fetched ${logs.length} log entries`);
      
      const result = await this.processLogs(logs);
      
      logger.info(`Mailcow sync completed`, result);

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

  startAutoSync(): void {
    logger.info(`Starting auto-sync: ${this.config.syncInterval}ms`);
    
    this.syncStatuses();
    
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
      }
    };
  }
}

export const mailcowStatusService = new MailcowStatusService();