import { emailStatusManager } from './EmailStatusManager';
import { metricsAggregator } from './MetricsAggregator';
import { EmailTracking } from '../../models/EmailTracking.model';
import { logger } from '../../utils/logger';
import Bull from 'bull';

export interface SyncSource {
  type: 'webhook' | 'mailcow' | 'sendgrid' | 'smtp';
  priority: number;
}

export class TrackingSyncService {
  private queue: Bull.Queue;
  private sourcePriority: Map<string, number> = new Map([
    ['webhook', 10],
    ['sendgrid', 9],
    ['mailcow', 8],
    ['smtp', 7],
    ['api', 6],
    ['manual', 5]
  ]);

  constructor() {
    this.queue = new Bull('tracking-sync', {
      redis: {
        port: parseInt(process.env.REDIS_PORT || '6379'),
        host: process.env.REDIS_HOST || 'localhost',
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    this.setupProcessors();
  }

  private setupProcessors(): void {
    // Process status updates
    this.queue.process('status-update', async (job) => {
      const { trackingId, status, metadata } = job.data;
      return await this.processStatusUpdate(trackingId, status, metadata);
    });

    // Process batch updates
    this.queue.process('batch-update', async (job) => {
      const { updates } = job.data;
      return await this.processBatchUpdate(updates);
    });

    // Process metrics recalculation
    this.queue.process('recalculate-metrics', async (job) => {
      const { campaignId } = job.data;
      return await metricsAggregator.updateCampaignMetrics(campaignId);
    });
  }

  async queueStatusUpdate(
    trackingId: string,
    status: string,
    metadata?: any
  ): Promise<void> {
    const priority = this.sourcePriority.get(metadata?.source) || 1;
    
    await this.queue.add(
      'status-update',
      { trackingId, status, metadata },
      { priority }
    );
  }

  private async processStatusUpdate(
    trackingId: string,
    status: string,
    metadata?: any
  ): Promise<any> {
    try {
      // Check for conflicts
      const hasConflict = await this.checkForConflict(trackingId, status, metadata);
      
      if (hasConflict) {
        const resolved = await this.resolveConflict(trackingId, status, metadata);
        if (!resolved) {
          logger.warn(`Conflict not resolved for ${trackingId}`);
          return { success: false, reason: 'conflict' };
        }
      }

      // Update the status
      const result = await emailStatusManager.updateStatus(trackingId, status as any, metadata);
      
      if (result.success && result.updated) {
        // Queue metrics recalculation
        const tracking = await EmailTracking.findOne({ trackingId });
        if (tracking) {
          await this.queue.add(
            'recalculate-metrics',
            { campaignId: tracking.campaignId },
            { delay: 5000 } // Delay to batch updates
          );
        }
      }

      return result;

    } catch (error) {
      logger.error('Error processing status update:', error);
      throw error;
    }
  }

  private async processBatchUpdate(updates: any[]): Promise<any> {
    const results = {
      processed: 0,
      updated: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const update of updates) {
      try {
        const result = await this.processStatusUpdate(
          update.trackingId,
          update.status,
          update.metadata
        );
        
        results.processed++;
        if (result.success && result.updated) {
          results.updated++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          trackingId: update.trackingId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private async checkForConflict(
    trackingId: string,
    newStatus: string,
    metadata?: any
  ): Promise<boolean> {
    // Check if there's a recent update from a higher priority source
    const recentKey = `tracking:${trackingId}:recent`;
    const recent = await this.queue.client.get(recentKey);
    
    if (recent) {
      const recentData = JSON.parse(recent);
      const recentPriority = this.sourcePriority.get(recentData.source) || 0;
      const currentPriority = this.sourcePriority.get(metadata?.source) || 0;
      
      return currentPriority < recentPriority;
    }

    return false;
  }

  private async resolveConflict(
    trackingId: string,
    status: string,
    metadata?: any
  ): Promise<boolean> {
    // Implement conflict resolution logic
    // For now, higher priority source wins
    const tracking = await EmailTracking.findOne({ trackingId });
    
    if (!tracking) return false;

    const lastUpdateSource = tracking.get('lastUpdateSource');
    const lastUpdatePriority = this.sourcePriority.get(lastUpdateSource) || 0;
    const currentPriority = this.sourcePriority.get(metadata?.source) || 0;

    return currentPriority >= lastUpdatePriority;
  }

  async getQueueStats(): Promise<any> {
    const jobCounts = await this.queue.getJobCounts();
    return {
      waiting: jobCounts.waiting,
      active: jobCounts.active,
      completed: jobCounts.completed,
      failed: jobCounts.failed,
      delayed: jobCounts.delayed
    };
  }

  async cleanup(): Promise<void> {
    await this.queue.close();
  }
}

export const trackingSyncService = new TrackingSyncService();