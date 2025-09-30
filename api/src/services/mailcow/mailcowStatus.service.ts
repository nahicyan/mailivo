// api/src/services/mailcow/mailcowStatus.service.ts - HIGH VOLUME VERSION
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
  maxLogsPerSync: number;
  bulkUpdateBatchSize: number;
  processingConcurrency: number;
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
  status: 'sent' | 'delivered' | 'bounced' | 'deferred' | 'rejected' | 'queued';
  recipient?: string;
  timestamp: Date;
  reason?: string;
  dsn?: string;
  from?: string;
}

interface BulkUpdateOperation {
  trackingId: string;
  updates: any;
}

export class MailcowStatusService {
  private config: MailcowConfig;
  private redis: Redis;
  private isProcessing: boolean = false;
  private lastProcessedTime: number;
  private queueIdToMessageId: Map<string, string> = new Map();
  private emailToTrackingCache: Map<string, any> = new Map();
  private pendingUpdates: BulkUpdateOperation[] = [];
  private processedQueueIds: Set<string> = new Set();
  private affectedCampaigns: Set<string> = new Set(); 

  constructor() {
    const apiUrl = process.env.MAILCOW_API_URL || '';
    const apiKey = process.env.MAILCOW_API_KEY || '';
    
    this.config = {
      apiUrl: apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl,
      apiKey: apiKey,
      logsPerBatch: parseInt(process.env.MAILCOW_LOGS_PER_BATCH || '1000'), // Increased for high volume
      syncInterval: parseInt(process.env.MAILCOW_SYNC_INTERVAL || '30000'), // 30 seconds for high volume
      maxLogsPerSync: parseInt(process.env.MAILCOW_MAX_LOGS_PER_SYNC || '10000'), // Process up to 10k logs per sync
      bulkUpdateBatchSize: parseInt(process.env.MAILCOW_BULK_UPDATE_SIZE || '100'), // Update DB in batches
      processingConcurrency: parseInt(process.env.MAILCOW_PROCESSING_CONCURRENCY || '10'), // Parallel processing
    };

    logger.info('Mailcow service initialized for HIGH VOLUME:', {
      apiUrl: this.config.apiUrl,
      hasApiKey: !!this.config.apiKey,
      logsPerBatch: this.config.logsPerBatch,
      maxLogsPerSync: this.config.maxLogsPerSync,
      bulkUpdateBatchSize: this.config.bulkUpdateBatchSize
    });

    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.lastProcessedTime = 0;
    this.initializeLastProcessedTime();
    
    // Clean up cache periodically
    setInterval(() => this.cleanupCaches(), 5 * 60 * 1000); // Every 5 minutes
  }

  private async initializeLastProcessedTime() {
    const stored = await this.redis.get('mailcow:last_processed_time');
    if (stored) {
      this.lastProcessedTime = parseInt(stored);
    } else {
      // For high volume, start from just 1 hour ago to avoid huge initial load
      this.lastProcessedTime = Date.now() - (60 * 60 * 1000);
    }
  }

  private cleanupCaches() {
    // Keep only recent entries in memory
    
    // Clean queue ID mapping
    for (const [queueId, _] of this.queueIdToMessageId.entries()) {
      if (this.processedQueueIds.has(queueId)) {
        this.queueIdToMessageId.delete(queueId);
      }
    }
    
    // Keep processed queue IDs list manageable
    if (this.processedQueueIds.size > 50000) {
      this.processedQueueIds.clear();
    }
    
    // Clear email cache if too large
    if (this.emailToTrackingCache.size > 10000) {
      this.emailToTrackingCache.clear();
    }
    
    logger.info('Cache cleanup completed', {
      queueIdMapSize: this.queueIdToMessageId.size,
      emailCacheSize: this.emailToTrackingCache.size,
      processedQueueSize: this.processedQueueIds.size
    });
  }

  async fetchLogsInBatches(): Promise<MailcowLogEntry[]> {
    const allLogs: MailcowLogEntry[] = [];
    let totalFetched = 0;
    let hasMore = true;
    
    while (hasMore && totalFetched < this.config.maxLogsPerSync) {
      try {
        const batchSize = Math.min(
          this.config.logsPerBatch,
          this.config.maxLogsPerSync - totalFetched
        );
        
        const fullUrl = `${this.config.apiUrl}/api/v1/get/logs/postfix/${batchSize}`;
        
        const response = await axios.get(fullUrl, {
          headers: {
            'X-API-Key': this.config.apiKey,
          },
          timeout: 30000,
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const newLogs = response.data.filter(log => {
            const logTime = parseInt(log.time, 10) * 1000;
            return logTime > this.lastProcessedTime;
          });
          
          if (newLogs.length === 0) {
            hasMore = false;
          } else {
            allLogs.push(...newLogs);
            totalFetched += newLogs.length;
            
            // If we got fewer logs than requested, we've reached the end
            if (response.data.length < batchSize) {
              hasMore = false;
            }
            
            // Small delay between batches to avoid overwhelming the API
            if (hasMore && totalFetched < this.config.maxLogsPerSync) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } else {
          hasMore = false;
        }
      } catch (error: any) {
        logger.error('Batch fetch failed:', {
          message: error.message,
          totalFetched
        });
        break;
      }
    }
    
    logger.info(`Fetched ${totalFetched} total log entries across batches`);
    return allLogs;
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
      const queueMessageMatch = message.match(/([A-F0-9]{8,12}):\s+message-id=<([^>]+)>/);
      if (queueMessageMatch) {
        const [, queueId, messageId] = queueMessageMatch;
        this.queueIdToMessageId.set(queueId, `<${messageId}>`);
        return null; // Just store mapping, don't process as status
      }

      // PATTERN 2: Status with queue ID
      const queueIdMatch = message.match(/([A-F0-9]{8,12}):/);
      const queueId = queueIdMatch?.[1];
      
      // Skip if we've already processed this queue ID for this status
      if (queueId && this.processedQueueIds.has(queueId + message.substring(0, 50))) {
        return null;
      }
      
      const statusMatch = message.match(/\bstatus=([\w-]+)/);
      const status = statusMatch?.[1];
      
      if (!queueId || !status) {
        return null;
      }

      // Mark as processed
      this.processedQueueIds.add(queueId + message.substring(0, 50));

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
      if (status === 'bounced' || status === 'deferred' || status === 'reject') {
        const reasonMatch = message.match(/\((.+)\)$/);
        reason = reasonMatch?.[1];
      }

      // Map status to our internal status
      let mappedStatus: ProcessedStatus['status'];
      switch (status) {
        case 'sent':
          if (dsn && dsn.startsWith('2.')) {
            mappedStatus = 'delivered';
          } else {
            mappedStatus = 'sent';
          }
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
      logger.error('Error parsing log:', error);
      return null;
    }
  }

  private async getTrackingRecord(statusInfo: ProcessedStatus): Promise<any> {
    // Check cache first
    const cacheKey = statusInfo.messageId || statusInfo.recipient || '';
    if (this.emailToTrackingCache.has(cacheKey)) {
      return this.emailToTrackingCache.get(cacheKey);
    }

    let trackingRecord = null;

    // Try to find by message ID first
    if (statusInfo.messageId) {
      trackingRecord = await EmailTracking.findOne({ 
        messageId: statusInfo.messageId 
      }).lean();
    }

    // If not found by message ID, try by recipient email
    if (!trackingRecord && statusInfo.recipient) {
      trackingRecord = await EmailTracking.findOne({
        contactEmail: statusInfo.recipient,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).sort({ createdAt: -1 }).lean();
    }

    // Cache the result
    if (trackingRecord && cacheKey) {
      this.emailToTrackingCache.set(cacheKey, trackingRecord);
    }

    return trackingRecord;
  }

  private async processBulkUpdates() {
    if (this.pendingUpdates.length === 0) return;

    const bulkOps = this.pendingUpdates.map(update => ({
      updateOne: {
        filter: { _id: update.trackingId },
        update: { $set: update.updates }
      }
    }));

    try {
      const result = await EmailTracking.bulkWrite(bulkOps, { ordered: false });
      logger.info(`Bulk update completed: ${result.modifiedCount} records updated`);
      
      // Clear processed updates
      this.pendingUpdates = [];
    } catch (error) {
      logger.error('Bulk update failed:', error);
      this.pendingUpdates = [];
    }
  }

  async processLogsOptimized(logs: MailcowLogEntry[]): Promise<{ 
    processed: number; 
    updated: number; 
    matchedByEmail: number 
  }> {
    let processed = 0;
    let updated = 0;
    let matchedByEmail = 0;

    // First pass: Build queue ID to message ID mapping
    logger.info('Building queue ID mappings...');
    for (const log of logs) {
      const message = log.message;
      const queueMessageMatch = message.match(/([A-F0-9]{8,12}):\s+message-id=<([^>]+)>/);
      if (queueMessageMatch) {
        const [, queueId, messageId] = queueMessageMatch;
        this.queueIdToMessageId.set(queueId, `<${messageId}>`);
      }
    }
    logger.info(`Built ${this.queueIdToMessageId.size} queue ID mappings`);

    // Second pass: Process status updates in chunks
    logger.info('Processing status updates...');
    const statusUpdates: ProcessedStatus[] = [];
    
    for (const log of logs) {
      const statusInfo = this.parseLogEntry(log);
      if (statusInfo) {
        statusUpdates.push(statusInfo);
        processed++;
      }
    }

    // Process updates in batches
    for (let i = 0; i < statusUpdates.length; i += this.config.bulkUpdateBatchSize) {
      const batch = statusUpdates.slice(i, i + this.config.bulkUpdateBatchSize);
      
      for (const statusInfo of batch) {
        try {
          const trackingRecord = await this.getTrackingRecord(statusInfo);

          if (trackingRecord) {
            if (!statusInfo.messageId && statusInfo.recipient) {
              matchedByEmail++;
            }

            const updates: any = {};
            let shouldUpdate = false;

            // Update based on status precedence
            if (statusInfo.status === 'delivered' && trackingRecord.status !== 'delivered') {
              updates.status = 'delivered';
              updates.deliveredAt = statusInfo.timestamp;
              shouldUpdate = true;
            } else if (statusInfo.status === 'bounced' && trackingRecord.status !== 'bounced') {
              updates.status = 'bounced';
              updates.bouncedAt = statusInfo.timestamp;
              updates.bounceReason = statusInfo.reason;
              updates.bounceDsn = statusInfo.dsn;
              shouldUpdate = true;
            } else if (statusInfo.status === 'deferred' && trackingRecord.status === 'sent') {
              updates.status = 'deferred';
              updates.deferredReason = statusInfo.reason;
              shouldUpdate = true;
            }

            // Update message ID if we now know it
            if (statusInfo.messageId && !trackingRecord.messageId) {
              updates.messageId = statusInfo.messageId;
              shouldUpdate = true;
            }

            if (shouldUpdate) {
               this.pendingUpdates.push({
                trackingId: trackingRecord._id.toString(),
                  updates
               });
               updated++;
  
            // Track affected campaign
            if (trackingRecord.campaignId) {
              this.affectedCampaigns.add(trackingRecord.campaignId.toString());
              }
            }
          }
        } catch (error) {
          logger.error('Error processing status update:', error);
        }
      }

      // Flush updates every batch
      if (this.pendingUpdates.length >= this.config.bulkUpdateBatchSize) {
        await this.processBulkUpdates();
      }
    }

    // Flush remaining updates
    if (this.pendingUpdates.length > 0) {
      await this.processBulkUpdates();
    }

    // Update last processed time
    if (logs.length > 0) {
      const latestTime = Math.max(...logs.map(l => parseInt(l.time, 10) * 1000));
      this.lastProcessedTime = latestTime;
      await this.redis.set('mailcow:last_processed_time', latestTime.toString());
    }
    await this.updateAffectedCampaignMetrics();

    return { processed, updated, matchedByEmail };
  }

  private async updateAffectedCampaignMetrics(): Promise<void> {
  if (this.affectedCampaigns.size === 0) return;
  
  logger.info(`Updating metrics for ${this.affectedCampaigns.size} affected campaigns`);
  
  for (const campaignId of this.affectedCampaigns) {
    await this.updateCampaignMetrics(campaignId);
  }
  
  this.affectedCampaigns.clear();
}

  async updateCampaignMetrics(campaignId: string): Promise<void> {
    try {
      const metrics = await EmailTracking.aggregate([
        { $match: { campaignId: campaignId } },
        { 
          $group: {
            _id: null,
            sent: { $sum: { $cond: [{ $ne: ['$status', 'pending'] }, 1, 0] } },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            bounced: { $sum: { $cond: [{ $eq: ['$status', 'bounced'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
          }
        }
      ]);

      if (metrics.length > 0) {
        await Campaign.findByIdAndUpdate(campaignId, {
          $set: {
            'metrics.sent': metrics[0].sent,
            'metrics.delivered': metrics[0].delivered,
            'metrics.bounced': metrics[0].bounced,
            'metrics.failed': metrics[0].failed,
            'metrics.clicked': metrics[0].clicked,
          }
        });
      }
    } catch (error) {
      logger.error(`Failed to update campaign metrics for ${campaignId}:`, error);
    }
  }

  async syncStatuses(): Promise<{ 
    success: boolean; 
    processed: number; 
    updated: number; 
    matchedByEmail?: number;
    error?: string 
  }> {
    if (this.isProcessing) {
      logger.info('Sync already in progress, skipping...');
      return { success: false, processed: 0, updated: 0, error: 'Already processing' };
    }

    if (!this.config.apiUrl || !this.config.apiKey) {
      logger.error('Mailcow not configured, skipping sync');
      return { success: false, processed: 0, updated: 0, error: 'Not configured' };
    }

    this.isProcessing = true;
    const startTime = Date.now();
    logger.info('Starting HIGH VOLUME Mailcow status sync...');

    try {
      // Fetch logs in batches
      const logs = await this.fetchLogsInBatches();
      
      if (logs.length === 0) {
        logger.info('No new logs to process');
        return { success: true, processed: 0, updated: 0 };
      }

      logger.info(`Processing ${logs.length} log entries...`);
      
      // Process with optimizations
      const result = await this.processLogsOptimized(logs);
      
      const duration = Date.now() - startTime;
      logger.info('Mailcow sync completed', {
        ...result,
        duration: `${duration}ms`,
        logsPerSecond: Math.round((logs.length / duration) * 1000)
      });
      
      return {
        success: true,
        ...result
      };
    } catch (error: any) {
      const errorMessage = error?.message ? error.message : 'Unknown error';
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
    if (process.env.MAILCOW_SYNC_ENABLED !== 'true') {
      logger.info('Mailcow sync disabled by configuration');
      return;
    }

    logger.info(`Starting HIGH VOLUME auto-sync: ${this.config.syncInterval}ms interval`);
    
    // Initial sync after a short delay
    setTimeout(() => this.syncStatuses(), 5000);
    
    // Schedule periodic syncs
    setInterval(() => {
      this.syncStatuses();
    }, this.config.syncInterval);
  }

  async getSyncStatus(): Promise<{
    lastSync: number;
    isProcessing: boolean;
    config: Partial<MailcowConfig>;
    cacheStats: {
      queueIdMapSize: number;
      emailCacheSize: number;
      processedQueueSize: number;
    };
  }> {
    return {
      lastSync: this.lastProcessedTime,
      isProcessing: this.isProcessing,
      config: {
        apiUrl: this.config.apiUrl,
        logsPerBatch: this.config.logsPerBatch,
        syncInterval: this.config.syncInterval,
        maxLogsPerSync: this.config.maxLogsPerSync,
        bulkUpdateBatchSize: this.config.bulkUpdateBatchSize,
      },
      cacheStats: {
        queueIdMapSize: this.queueIdToMessageId.size,
        emailCacheSize: this.emailToTrackingCache.size,
        processedQueueSize: this.processedQueueIds.size,
      }
    };
  }
}

export const mailcowStatusService = new MailcowStatusService();