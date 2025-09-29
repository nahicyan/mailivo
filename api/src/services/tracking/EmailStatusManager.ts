import { EmailTracking, EmailStatus, IEmailTracking } from '../../models/EmailTracking.model';
import { Campaign } from '../../models/Campaign';
import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { Redis } from 'ioredis';

export interface StatusTransition {
  from: EmailStatus[];
  to: EmailStatus;
  timestamp: Date;
  reason?: string;
  metadata?: Record<string, any>;
}

export class EmailStatusManager extends EventEmitter {
  private redis: Redis;
  private readonly STATUS_HIERARCHY: Record<EmailStatus, number> = {
    'queued': 1,
    'sent': 2,
    'deferred': 2.5,
    'delivered': 3,
    'opened': 4,
    'clicked': 5,
    'unsubscribe': 6,
    'resubscribe': 7,
    // Terminal states
    'bounced': 10,
    'dropped': 10,
    'rejected': 10,
    'failed': 10,
    'complaint': 10,
    'rendering_failure': 10,
    'delivery_delay': 10
  };

  private readonly VALID_TRANSITIONS: Map<EmailStatus, EmailStatus[]> = new Map([
    ['queued', ['sent', 'dropped', 'failed', 'rendering_failure']],
    ['sent', ['delivered', 'bounced', 'deferred', 'rejected', 'failed', 'delivery_delay']],
    ['deferred', ['sent', 'delivered', 'bounced', 'failed']],
    ['delivered', ['opened', 'clicked', 'unsubscribe', 'complaint']],
    ['opened', ['clicked', 'unsubscribe', 'complaint']],
    ['clicked', ['unsubscribe', 'complaint']],
    ['unsubscribe', ['resubscribe']],
    ['resubscribe', ['opened', 'clicked', 'unsubscribe']],
    // Terminal states - no further transitions
    ['bounced', []],
    ['dropped', []],
    ['rejected', []],
    ['failed', []],
    ['complaint', []],
    ['rendering_failure', []],
    ['delivery_delay', []]
  ]);

  constructor(redisUrl?: string) {
    super();
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async updateStatus(
    trackingId: string,
    newStatus: EmailStatus,
    metadata?: {
      reason?: string;
      messageId?: string;
      timestamp?: Date;
      source?: 'webhook' | 'mailcow' | 'api' | 'manual';
      bounceType?: 'hard' | 'soft' | 'unknown';
      dsn?: string;
      [key: string]: any;
    }
  ): Promise<{ success: boolean; updated: boolean; error?: string }> {
    try {
      // Get current tracking record
      const tracking = await EmailTracking.findOne({ trackingId });
      
      if (!tracking) {
        return { 
          success: false, 
          updated: false, 
          error: `Tracking record not found: ${trackingId}` 
        };
      }

      // Check if transition is valid
      const isValidTransition = this.isValidTransition(tracking.status, newStatus);
      if (!isValidTransition && !this.shouldOverrideTransition(tracking.status, newStatus)) {
        logger.debug(`Invalid transition from ${tracking.status} to ${newStatus} for ${trackingId}`);
        return { 
          success: true, 
          updated: false, 
          error: `Invalid status transition: ${tracking.status} -> ${newStatus}` 
        };
      }

      // Update the tracking record
      const previousStatus = tracking.status;
      tracking.status = newStatus;

      // Update timestamps and metadata
      this.updateTrackingMetadata(tracking, newStatus, metadata);

      // Save the tracking record
      await tracking.save();

      // Emit status change event
      this.emit('statusChanged', {
        trackingId,
        campaignId: tracking.campaignId,
        contactId: tracking.contactId,
        previousStatus,
        newStatus,
        metadata
      });

      // Update campaign metrics
      await this.updateCampaignMetrics(tracking.campaignId, previousStatus, newStatus);

      // Cache the status update
      await this.cacheStatusUpdate(trackingId, newStatus, metadata);

      logger.info(`Status updated: ${trackingId} from ${previousStatus} to ${newStatus}`);
      
      return { success: true, updated: true };

    } catch (error) {
      logger.error('Error updating status:', error);
      return { 
        success: false, 
        updated: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private isValidTransition(currentStatus: EmailStatus, newStatus: EmailStatus): boolean {
    const validTransitions = this.VALID_TRANSITIONS.get(currentStatus);
    return validTransitions ? validTransitions.includes(newStatus) : false;
  }

  private shouldOverrideTransition(currentStatus: EmailStatus, newStatus: EmailStatus): boolean {
    // Allow override if new status has higher hierarchy
    const currentHierarchy = this.STATUS_HIERARCHY[currentStatus];
    const newHierarchy = this.STATUS_HIERARCHY[newStatus];
    
    // Terminal states (hierarchy >= 10) should not be overridden
    if (currentHierarchy >= 10) {
      return false;
    }
    
    return newHierarchy > currentHierarchy;
  }

  private updateTrackingMetadata(
    tracking: IEmailTracking,
    status: EmailStatus,
    metadata?: any
  ): void {
    const now = metadata?.timestamp || new Date();

    switch (status) {
      case 'sent':
        tracking.sentAt = now;
        break;
      case 'delivered':
        tracking.deliveredAt = now;
        break;
      case 'opened':
        if (!tracking.openedAt) tracking.openedAt = now;
        break;
      case 'clicked':
        if (!tracking.clickedAt) tracking.clickedAt = now;
        break;
      case 'bounced':
        tracking.bouncedAt = now;
        tracking.bounceReason = metadata?.reason;
        tracking.bounceType = metadata?.bounceType;
        tracking.dsn = metadata?.dsn;
        break;
      case 'dropped':
        tracking.droppedAt = now;
        tracking.dropReason = metadata?.reason;
        break;
      case 'rejected':
        tracking.rejectedAt = now;
        tracking.rejectReason = metadata?.reason;
        break;
      case 'deferred':
        tracking.deferredAt = now;
        tracking.deferralReason = metadata?.reason;
        tracking.deferralCount = (tracking.deferralCount || 0) + 1;
        break;
      case 'complaint':
        tracking.complaintAt = now;
        tracking.complaintType = metadata?.complaintType;
        break;
      case 'unsubscribe':
        tracking.unsubscribeAt = now;
        break;
      case 'resubscribe':
        tracking.resubscribeAt = now;
        break;
      case 'failed':
        tracking.failedAt = now;
        tracking.error = metadata?.reason;
        break;
      case 'rendering_failure':
        tracking.renderingFailureAt = now;
        tracking.renderingError = metadata?.reason;
        break;
      case 'delivery_delay':
        tracking.deliveryDelayAt = now;
        break;
    }

    // Update message ID if provided
    if (metadata?.messageId && !tracking.messageId) {
      tracking.messageId = metadata.messageId;
    }
  }

  private async updateCampaignMetrics(
    campaignId: string,
    previousStatus: EmailStatus,
    newStatus: EmailStatus
  ): Promise<void> {
    try {
      const updates: any = {};

      // Decrement previous status count if it's a counted status
      if (this.isCountedStatus(previousStatus)) {
        updates[`metrics.${previousStatus}`] = -1;
      }

      // Increment new status count
      if (this.isCountedStatus(newStatus)) {
        updates[`metrics.${newStatus}`] = 1;
      }

      // Special handling for key metrics
      if (newStatus === 'delivered' && previousStatus === 'sent') {
        updates['metrics.sent'] = -1;
        updates['metrics.delivered'] = 1;
      }

      if (Object.keys(updates).length > 0) {
        await Campaign.findByIdAndUpdate(campaignId, { $inc: updates });
      }

    } catch (error) {
      logger.error(`Failed to update campaign metrics for ${campaignId}:`, error);
      // Don't throw - metrics update is not critical
    }
  }

  private isCountedStatus(status: EmailStatus): boolean {
    const countedStatuses: EmailStatus[] = [
      'queued', 'sent', 'delivered', 'opened', 'clicked',
      'bounced', 'failed', 'dropped', 'rejected', 'complaint', 
      'unsubscribe'
    ];
    return countedStatuses.includes(status);
  }

  private async cacheStatusUpdate(
    trackingId: string,
    status: EmailStatus,
    metadata?: any
  ): Promise<void> {
    const key = `tracking:${trackingId}:status`;
    const value = JSON.stringify({
      status,
      timestamp: new Date(),
      metadata
    });
    
    await this.redis.setex(key, 3600, value); // Cache for 1 hour
  }

  async getStatusHistory(trackingId: string): Promise<StatusTransition[]> {
    const key = `tracking:${trackingId}:history`;
    const history = await this.redis.lrange(key, 0, -1);
    return history.map(h => JSON.parse(h));
  }

  async cleanup(): Promise<void> {
    this.redis.disconnect();
    this.removeAllListeners();
  }
}

export const emailStatusManager = new EmailStatusManager();