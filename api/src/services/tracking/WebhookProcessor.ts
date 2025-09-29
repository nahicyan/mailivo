import { trackingSyncService } from './TrackingSyncService';
import { EmailTracking } from '../../models/EmailTracking.model';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

export interface WebhookEvent {
  provider: 'sendgrid' | 'mailcow' | 'mailgun' | 'ses';
  event: string;
  messageId: string;
  recipient?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export class WebhookProcessor {
  private providerMappings = new Map([
    // SendGrid mappings
    ['processed', 'sent'],
    ['delivered', 'delivered'],
    ['open', 'opened'],
    ['click', 'clicked'],
    ['bounce', 'bounced'],
    ['dropped', 'dropped'],
    ['deferred', 'deferred'],
    ['spamreport', 'complaint'],
    ['unsubscribe', 'unsubscribe'],
    // Mailcow mappings
    ['sent', 'sent'],
    ['delivered', 'delivered'],
    ['rejected', 'rejected'],
    ['failed', 'failed'],
    ['deferred', 'deferred']
  ]);

  async processWebhook(
    provider: string,
    payload: any,
    signature?: string
  ): Promise<{ processed: number; errors: any[] }> {
    try {
      // Verify webhook signature if configured
      if (!this.verifySignature(provider, payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      // Normalize events based on provider
      const events = this.normalizeEvents(provider, payload);
      
      const results = {
        processed: 0,
        errors: [] as any[]
      };

      for (const event of events) {
        try {
          await this.processEvent(event);
          results.processed++;
        } catch (error) {
          results.errors.push({
            event,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return results;

    } catch (error) {
      logger.error(`Webhook processing error for ${provider}:`, error);
      throw error;
    }
  }

  private verifySignature(provider: string, payload: any, signature?: string): boolean {
    if (!signature) return true; // Skip if no signature provided

    const secret = process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`];
    if (!secret) return true; // Skip if no secret configured

    switch (provider) {
      case 'sendgrid':
        return this.verifySendGridSignature(payload, signature, secret);
      case 'mailcow':
        return signature === secret;
      default:
        return true;
    }
  }

  private verifySendGridSignature(payload: any, signature: string, secret: string): boolean {
    const timestamp = signature.split(' ')[0];
    const hash = signature.split(' ')[1];
    
    const payloadString = JSON.stringify(payload);
    const signatureBase = `${timestamp}${payloadString}`;
    
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(signatureBase)
      .digest('hex');
    
    return hash === expectedHash;
  }

  private normalizeEvents(provider: string, payload: any): WebhookEvent[] {
    switch (provider) {
      case 'sendgrid':
        return this.normalizeSendGridEvents(payload);
      case 'mailcow':
        return this.normalizeMailcowEvents(payload);
      default:
        return [];
    }
  }

  private normalizeSendGridEvents(payload: any): WebhookEvent[] {
    const events = Array.isArray(payload) ? payload : [payload];
    
    return events.map(event => ({
      provider: 'sendgrid' as const,
      event: this.providerMappings.get(event.event) || event.event,
      messageId: event.sg_message_id,
      recipient: event.email,
      timestamp: event.timestamp * 1000,
      metadata: {
        reason: event.reason,
        response: event.response,
        attempt: event.attempt,
        category: event.category,
        url: event.url
      }
    }));
  }

  private normalizeMailcowEvents(payload: any): WebhookEvent[] {
    return [{
      provider: 'mailcow' as const,
      event: this.providerMappings.get(payload.status) || payload.status,
      messageId: payload.message_id,
      recipient: payload.recipient,
      timestamp: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
      metadata: {
        queueId: payload.queue_id,
        reason: payload.reason,
        dsn: payload.dsn
      }
    }];
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    // Find tracking record by message ID or email
    let tracking = await EmailTracking.findOne({ 
      messageId: event.messageId 
    });

    // Fallback to email lookup if message ID not found
    if (!tracking && event.recipient) {
      tracking = await EmailTracking.findOne({
        contactEmail: event.recipient,
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
        }
      }).sort({ createdAt: -1 });
    }

    if (!tracking) {
      logger.warn(`Tracking record not found for webhook event:`, event);
      return;
    }

    // Queue status update
    await trackingSyncService.queueStatusUpdate(
      tracking.trackingId,
      event.event,
      {
        source: event.provider,
        timestamp: new Date(event.timestamp || Date.now()),
        ...event.metadata
      }
    );
  }
}

export const webhookProcessor = new WebhookProcessor();