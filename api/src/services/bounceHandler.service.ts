// api/src/services/bounceHandler.service.ts
import { EmailTracking } from '../models/EmailTracking.model';
import { Campaign } from '../models/Campaign';
import { logger } from '../utils/logger';

export interface BounceInfo {
  type: 'hard' | 'soft' | 'blocked';
  category: string;
  reason: string;
  timestamp: Date;
}

export class BounceHandlerService {
  
  // Process SMTP bounce response
  async handleSmtpBounce(messageId: string, error: any): Promise<void> {
    const bounceInfo = this.parseSmtpError(error);
    
    const tracking = await EmailTracking.findOne({ messageId });
    if (!tracking) {
      logger.warn(`No tracking found for bounced message: ${messageId}`);
      return;
    }

    await this.recordBounce(tracking, bounceInfo);
  }

  // Process webhook bounce event
  async handleWebhookBounce(event: any): Promise<void> {
    const { sg_message_id, reason, bounce_classification } = event;
    
    const tracking = await EmailTracking.findOne({ 
      messageId: sg_message_id 
    });
    
    if (!tracking) return;

    const bounceInfo: BounceInfo = {
      type: this.classifyBounceType(bounce_classification),
      category: bounce_classification || 'unknown',
      reason: reason || 'Unknown reason',
      timestamp: new Date(event.timestamp * 1000)
    };

    await this.recordBounce(tracking, bounceInfo);
  }

  private async recordBounce(tracking: any, bounceInfo: BounceInfo): Promise<void> {
    tracking.status = 'bounced';
    tracking.bouncedAt = bounceInfo.timestamp;
    tracking.bounceType = bounceInfo.type;
    tracking.bounceCategory = bounceInfo.category;
    tracking.bounceReason = bounceInfo.reason;
    
    await tracking.save();

    // Update campaign metrics
    await Campaign.findByIdAndUpdate(tracking.campaignId, {
      $inc: { 
        'metrics.bounced': 1,
        [`metrics.${bounceInfo.type}Bounce`]: 1
      }
    });

    logger.info(`Bounce recorded`, {
      trackingId: tracking.trackingId,
      type: bounceInfo.type,
      category: bounceInfo.category
    });
  }

  private parseSmtpError(error: any): BounceInfo {
    const errorMessage = error.message || error.toString();
    // const responseCode = error.responseCode || '';
    
    // Common bounce patterns
    if (/550|User unknown|No such user/i.test(errorMessage)) {
      return {
        type: 'hard',
        category: 'invalid_recipient',
        reason: errorMessage,
        timestamp: new Date()
      };
    } else if (/mailbox full|over quota/i.test(errorMessage)) {
      return {
        type: 'soft',
        category: 'mailbox_full',
        reason: errorMessage,
        timestamp: new Date()
      };
    } else if (/blocked|blacklisted|spam/i.test(errorMessage)) {
      return {
        type: 'blocked',
        category: 'blocked',
        reason: errorMessage,
        timestamp: new Date()
      };
    }
    
    return {
      type: 'soft',
      category: 'temporary',
      reason: errorMessage,
      timestamp: new Date()
    };
  }

  private classifyBounceType(classification: string): 'hard' | 'soft' | 'blocked' {
    if (/hard|permanent|invalid/i.test(classification)) return 'hard';
    if (/blocked|spam|policy/i.test(classification)) return 'blocked';
    return 'soft';
  }
}

export const bounceHandlerService = new BounceHandlerService();