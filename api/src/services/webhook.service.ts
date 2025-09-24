// api/src/services/webhook.service.ts
import { EmailTracking } from '../models/EmailTracking.model';
import { Campaign } from '../models/Campaign';
import { logger } from '../utils/logger';
import { Contact } from '../models/Contact.model'; 

interface WebhookEvent {
  messageId?: string;
  trackingId?: string;
  eventType: string;
  timestamp: Date;
  email: string;
  reason?: string;
  metadata?: any;
}

class WebhookService {
  async processSendGridWebhook(events: any[]): Promise<void> {
    for (const event of events) {
      await this.processEvent({
        messageId: event.sg_message_id,
        trackingId: event.unique_args?.tracking_id,
        eventType: event.event,
        timestamp: new Date(event.timestamp * 1000),
        email: event.email,
        reason: event.reason || event.response,
        metadata: {
          ip: event.ip,
          userAgent: event.useragent,
          url: event.url,
          attemptNum: event.attempt,
        }
      });
    }
  }

  async processSMTPWebhook(event: any): Promise<void> {
    // Handle SMTP provider webhooks (AWS SES, Postmark, etc.)
    await this.processEvent({
      messageId: event.mail?.messageId,
      trackingId: event.mail?.headers?.['X-Tracking-Id'],
      eventType: this.mapSMTPEventType(event.eventType),
      timestamp: new Date(event.mail?.timestamp || Date.now()),
      email: event.mail?.destination?.[0],
      reason: event.bounce?.bouncedRecipients?.[0]?.diagnosticCode,
    });
  }

  
  private async handleDropped(tracking: any, event: WebhookEvent) {
    tracking.status = 'failed';
    tracking.error = event.reason || 'Email dropped';
    await tracking.save();

    await Campaign.findByIdAndUpdate(tracking.campaignId, {
      $inc: { 'metrics.bounced': 1 }
    });

    logger.warn('Email dropped', {
      trackingId: tracking.trackingId,
      reason: event.reason
    });
  }

  private async handleDeferred(tracking: any, event: WebhookEvent) {
    tracking.status = 'deferred';
    tracking.deferredAt = event.timestamp;
    tracking.deferredReason = event.reason;
    await tracking.save();

    logger.info('Email deferred', {
      trackingId: tracking.trackingId,
      reason: event.reason
    });
  }

  private async handleComplaint(tracking: any, event: WebhookEvent) {
    await Campaign.findByIdAndUpdate(tracking.campaignId, {
      $inc: { 'metrics.complained': 1 }
    });

    await Contact.findByIdAndUpdate(tracking.contactId, {
      $set: { 
        'deliverability.complained': true,
        'deliverability.complaintDate': event.timestamp
      }
    });

    logger.warn('Spam complaint received', {
      trackingId: tracking.trackingId,
      contactId: tracking.contactId
    });
  }
  private async processEvent(event: WebhookEvent): Promise<void> {
    try {
      // Find tracking record by messageId or trackingId
      const tracking = await EmailTracking.findOne({
        $or: [
          { messageId: event.messageId },
          { trackingId: event.trackingId }
        ]
      });

      if (!tracking) {
        logger.warn('Tracking record not found', { event });
        return;
      }

      switch (event.eventType) {
        case 'delivered':
        case 'delivery':
          await this.handleDelivery(tracking, event);
          break;
        
        case 'bounce':
        case 'hard_bounce':
        case 'soft_bounce':
          await this.handleBounce(tracking, event);
          break;
        
        case 'dropped':
        case 'rejected':
          await this.handleDropped(tracking, event);
          break;
        
        case 'deferred':
          await this.handleDeferred(tracking, event);
          break;
        
        case 'complaint':
        case 'spamreport':
          await this.handleComplaint(tracking, event);
          break;
      }
    } catch (error) {
      logger.error('Webhook processing error:', error);
    }
  }

  private async handleDelivery(tracking: any, event: WebhookEvent) {
    // Only update if not already marked as delivered
    if (tracking.status !== 'delivered') {
      tracking.status = 'delivered';
      tracking.deliveredAt = event.timestamp;
      await tracking.save();

      await Campaign.findByIdAndUpdate(tracking.campaignId, {
        $inc: { 'metrics.delivered': 1 }
      });

      logger.info('Email delivered', {
        trackingId: tracking.trackingId,
        email: event.email
      });
    }
  }


async processMailcowWebhook(data: any): Promise<void> {
  // Mailcow webhook data structure
  await this.processEvent({
    messageId: data.message_id || data['Message-ID'],
    trackingId: data.tracking_id || data['X-Tracking-Id'],
    eventType: this.mapMailcowEventType(data.event || data.status),
    timestamp: new Date(data.timestamp || Date.now()),
    email: data.recipient || data.to,
    reason: data.reason || data.diagnostic_code,
    metadata: {
      queue_id: data.queue_id,
      dsn: data.dsn,
    }
  });
}

private mapMailcowEventType(type: string): string {
  const mapping: Record<string, string> = {
    'sent': 'delivered',
    'deferred': 'deferred',
    'bounced': 'bounce',
    'reject': 'rejected',
  };
  return mapping[type] || type.toLowerCase();
}

  private async handleBounce(tracking: any, event: WebhookEvent) {
    const bounceType = event.eventType.includes('hard') ? 'hard' : 'soft';
    
    tracking.status = 'bounced';
    tracking.bouncedAt = event.timestamp;
    tracking.bounceReason = event.reason;
    tracking.bounceType = bounceType;
    await tracking.save();

    await Campaign.findByIdAndUpdate(tracking.campaignId, {
      $inc: { 
        'metrics.bounced': 1,
        [`metrics.${bounceType}Bounces`]: 1
      }
    });

    // Mark contact as undeliverable for hard bounces
    if (bounceType === 'hard') {
      await Contact.findByIdAndUpdate(tracking.contactId, {
        $set: { 'deliverability.status': 'invalid' }
      });
    }
  }

  private mapSMTPEventType(type: string): string {
    const mapping: Record<string, string> = {
      'Send': 'sent',
      'Delivery': 'delivered',
      'Bounce': 'bounce',
      'Complaint': 'complaint',
      'Reject': 'rejected',
    };
    return mapping[type] || type.toLowerCase();
  }
}

export const webhookService = new WebhookService();