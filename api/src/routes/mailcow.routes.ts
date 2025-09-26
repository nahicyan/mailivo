// api/src/routes/mailcow.routes.ts
import { Router, Request, Response } from 'express';
import { mailcowStatusService } from '../services/mailcow/mailcowStatus.service';
import { EmailTracking } from '../models/EmailTracking.model';
import { Campaign } from '../models/Campaign';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Manual sync endpoint (protected)
router.post('/sync', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await mailcowStatusService.syncStatuses();
    res.json(result);
  } catch (error) {
    logger.error('Manual sync failed:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Get sync status (protected)
router.get('/status', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const status = await mailcowStatusService.getSyncStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error fetching sync status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// Webhook endpoint for real-time updates from external services
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.MAILCOW_WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = req.headers['x-webhook-secret'];
      if (providedSecret !== webhookSecret) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
    }

    const { 
      message_id, 
      queue_id, // Keep this for potential future logging
      status, 
      recipient, // Keep this for potential validation
      timestamp,
      reason,
      dsn 
    } = req.body;

    // Log the webhook data for debugging
    logger.debug('Webhook received', {
      message_id,
      queue_id,
      status,
      recipient,
      timestamp
    });

    if (!message_id || !status) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Find the tracking record
    const tracking = await EmailTracking.findOne({ 
      messageId: message_id 
    });

    if (!tracking) {
      logger.warn(`Webhook: Tracking not found for messageId: ${message_id}`);
      res.status(404).json({ error: 'Tracking record not found' });
      return;
    }

    // Update based on status
    const previousStatus = tracking.status;
    let updated = false;

    switch (status) {
      case 'delivered':
        if (!['opened', 'clicked'].includes(tracking.status)) {
          tracking.status = 'delivered';
          tracking.deliveredAt = new Date(timestamp || Date.now());
          updated = true;
        }
        break;

      case 'bounced':
        tracking.status = 'bounced';
        tracking.bouncedAt = new Date(timestamp || Date.now());
        tracking.bounceReason = reason || 'Unknown';
        tracking.bounceType = determineBounceType(dsn, reason);
        updated = true;
        break;

      case 'failed':
      case 'rejected':
        tracking.status = 'failed';
        tracking.error = reason || 'Delivery failed';
        updated = true;
        break;

      case 'deferred':
        if (!['delivered', 'opened', 'clicked', 'bounced'].includes(tracking.status)) {
          tracking.error = `Deferred: ${reason || 'Temporary issue'}`;
        }
        break;
    }

    if (updated) {
      await tracking.save();

      // Update campaign metrics
      if (tracking.campaignId) {
        await updateCampaignMetricsFromWebhook(
          tracking.campaignId,
          status,
          previousStatus
        );
      }

      logger.info(`Webhook processed: ${status} for ${message_id}`);
    }

    res.json({ success: true, updated });
  } catch (error) {
    logger.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper function to determine bounce type
function determineBounceType(dsn?: string, reason?: string): 'hard' | 'soft' | 'unknown' {
  if (dsn) {
    if (dsn.startsWith('5')) return 'hard';
    if (dsn.startsWith('4')) return 'soft';
  }

  if (reason) {
    const lowerReason = reason.toLowerCase();
    
    if (
      lowerReason.includes('user unknown') ||
      lowerReason.includes('no such user') ||
      lowerReason.includes('invalid') ||
      lowerReason.includes('does not exist')
    ) {
      return 'hard';
    }

    if (
      lowerReason.includes('mailbox full') ||
      lowerReason.includes('quota') ||
      lowerReason.includes('temporarily')
    ) {
      return 'soft';
    }
  }

  return 'unknown';
}

// Helper function to update campaign metrics
async function updateCampaignMetricsFromWebhook(
  campaignId: string,
  newStatus: string,
  previousStatus: string
): Promise<void> {
  try {
    const updates: any = {};

    switch (newStatus) {
      case 'delivered':
        if (previousStatus === 'sent') {
          updates['metrics.delivered'] = 1;
          updates['metrics.sent'] = -1;
        }
        break;
      case 'bounced':
        updates['metrics.bounced'] = 1;
        if (previousStatus === 'sent') {
          updates['metrics.sent'] = -1;
        }
        break;
      case 'failed':
      case 'rejected':
        updates['metrics.failed'] = 1;
        if (previousStatus === 'sent') {
          updates['metrics.sent'] = -1;
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      await Campaign.findByIdAndUpdate(campaignId, { $inc: updates });
    }
  } catch (error) {
    logger.error('Error updating campaign metrics from webhook:', error);
  }
}

export default router;