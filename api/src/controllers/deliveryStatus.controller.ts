// api/src/controllers/deliveryStatus.controller.ts
import { Request, Response } from 'express';
import { EmailTracking } from '../models/EmailTracking.model';
//import { Campaign } from '../models/Campaign';
import { logger } from '../utils/logger';
import { mailcowStatusService } from '../services/mailcow/mailcowStatus.service';

export class DeliveryStatusController {
  // Get delivery status for a specific campaign
  async getCampaignDeliveryStatus(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const { bounceType, status } = req.query;

      const query: any = { campaignId };
      if (bounceType) query.bounceType = bounceType;
      if (status) query.status = status;

      const trackingRecords = await EmailTracking.find(query)
        .select('contactId contactEmail status deliveredAt bouncedAt bounceReason bounceType dsn messageId')
        .sort({ createdAt: -1 });

      const stats = {
        total: trackingRecords.length,
        delivered: trackingRecords.filter(r => r.status === 'delivered').length,
        bounced: trackingRecords.filter(r => r.status === 'bounced').length,
        hardBounces: trackingRecords.filter(r => r.bounceType === 'hard').length,
        softBounces: trackingRecords.filter(r => r.bounceType === 'soft').length,
        failed: trackingRecords.filter(r => r.status === 'failed').length,
        pending: trackingRecords.filter(r => ['queued', 'sent'].includes(r.status)).length,
      };

      res.json({
        campaignId,
        stats,
        records: trackingRecords,
      });
    } catch (error) {
      logger.error('Error fetching campaign delivery status:', error);
      res.status(500).json({ error: 'Failed to fetch delivery status' });
    }
  }

  // Get bounced emails list
  async getBouncedEmails(req: Request, res: Response): Promise<void> {
    try {
      const { days = 7, type } = req.query;
      const dateThreshold = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

      const query: any = {
        status: 'bounced',
        bouncedAt: { $gte: dateThreshold },
      };

      if (type && ['hard', 'soft'].includes(type as string)) {
        query.bounceType = type;
      }

      const bouncedEmails = await EmailTracking.find(query)
        .populate('contactId', 'email firstName lastName')
        .select('contactEmail bounceReason bounceType dsn bouncedAt campaignId')
        .sort({ bouncedAt: -1 });

      res.json({
        total: bouncedEmails.length,
        hardBounces: bouncedEmails.filter(e => e.bounceType === 'hard').length,
        softBounces: bouncedEmails.filter(e => e.bounceType === 'soft').length,
        emails: bouncedEmails,
      });
    } catch (error) {
      logger.error('Error fetching bounced emails:', error);
      res.status(500).json({ error: 'Failed to fetch bounced emails' });
    }
  }

  // Force sync with Mailcow
  async forceSyncMailcow(_req: Request, res: Response): Promise<void> {
    try {
      const result = await mailcowStatusService.syncStatuses();
      res.json(result);
    } catch (error) {
      logger.error('Error forcing Mailcow sync:', error);
      res.status(500).json({ error: 'Sync failed' });
    }
  }

  // Get delivery metrics summary
  async getDeliveryMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      const query: any = {};
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      const [totalSent, delivered, bounced, hardBounces, softBounces] = await Promise.all([
        EmailTracking.countDocuments(query),
        EmailTracking.countDocuments({ ...query, status: 'delivered' }),
        EmailTracking.countDocuments({ ...query, status: 'bounced' }),
        EmailTracking.countDocuments({ ...query, bounceType: 'hard' }),
        EmailTracking.countDocuments({ ...query, bounceType: 'soft' }),
      ]);

      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
      const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
      const hardBounceRate = totalSent > 0 ? (hardBounces / totalSent) * 100 : 0;

      res.json({
        metrics: {
          totalSent,
          delivered,
          bounced,
          hardBounces,
          softBounces,
          deliveryRate: deliveryRate.toFixed(2),
          bounceRate: bounceRate.toFixed(2),
          hardBounceRate: hardBounceRate.toFixed(2),
        },
        healthStatus: {
          good: bounceRate < 2,
          warning: bounceRate >= 2 && bounceRate < 5,
          critical: bounceRate >= 5,
        },
      });
    } catch (error) {
      logger.error('Error fetching delivery metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  }
}

export const deliveryStatusController = new DeliveryStatusController();