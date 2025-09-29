import { EmailTracking, EmailStatus } from '../../models/EmailTracking.model';
import { Campaign } from '../../models/Campaign';
import { logger } from '../../utils/logger';

export interface CampaignMetrics {
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  dropped: number;
  rejected: number;
  deferred: number;
  complaints: number;
  unsubscribed: number;
  // Rates
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  bounceRate: number;
  complaintRate: number;
  unsubscribeRate: number;
  // Engagement
  uniqueOpens: number;
  uniqueClicks: number;
  totalOpens: number;
  totalClicks: number;
}

export class MetricsAggregator {
  async calculateCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    try {
      // Get all tracking records for the campaign
      const trackingRecords = await EmailTracking.find({ campaignId });
      
      const metrics: CampaignMetrics = {
        total: trackingRecords.length,
        queued: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        failed: 0,
        dropped: 0,
        rejected: 0,
        deferred: 0,
        complaints: 0,
        unsubscribed: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        clickToOpenRate: 0,
        bounceRate: 0,
        complaintRate: 0,
        unsubscribeRate: 0,
        uniqueOpens: 0,
        uniqueClicks: 0,
        totalOpens: 0,
        totalClicks: 0
      };

      // Count statuses
      const uniqueOpeners = new Set<string>();
      const uniqueClickers = new Set<string>();

      for (const record of trackingRecords) {
        // Count by status
        metrics[record.status]++;

        // Track unique opens/clicks
        if (record.openedAt) {
          uniqueOpeners.add(record.contactId);
          metrics.totalOpens++;
        }
        
        if (record.clickedAt) {
          uniqueClickers.add(record.contactId);
          metrics.totalClicks += record.linkClicks?.length || 0;
        }
      }

      metrics.uniqueOpens = uniqueOpeners.size;
      metrics.uniqueClicks = uniqueClickers.size;

      // Calculate rates
      if (metrics.total > 0) {
        metrics.deliveryRate = (metrics.delivered / metrics.total) * 100;
        metrics.bounceRate = (metrics.bounced / metrics.total) * 100;
      }

      if (metrics.delivered > 0) {
        metrics.openRate = (metrics.uniqueOpens / metrics.delivered) * 100;
        metrics.clickRate = (metrics.uniqueClicks / metrics.delivered) * 100;
        metrics.complaintRate = (metrics.complaints / metrics.delivered) * 100;
        metrics.unsubscribeRate = (metrics.unsubscribed / metrics.delivered) * 100;
      }

      if (metrics.uniqueOpens > 0) {
        metrics.clickToOpenRate = (metrics.uniqueClicks / metrics.uniqueOpens) * 100;
      }

      return metrics;

    } catch (error) {
      logger.error(`Error calculating metrics for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  async updateCampaignMetrics(campaignId: string): Promise<void> {
    try {
      const metrics = await this.calculateCampaignMetrics(campaignId);
      
      await Campaign.findByIdAndUpdate(campaignId, {
        metrics: {
          totalRecipients: metrics.total,
          sent: metrics.sent,
          delivered: metrics.delivered,
          opened: metrics.uniqueOpens,
          clicked: metrics.uniqueClicks,
          bounced: metrics.bounced,
          failed: metrics.failed,
          unsubscribed: metrics.unsubscribed,
          complaints: metrics.complaints,
          // Rates
          deliveryRate: parseFloat(metrics.deliveryRate.toFixed(2)),
          openRate: parseFloat(metrics.openRate.toFixed(2)),
          clickRate: parseFloat(metrics.clickRate.toFixed(2)),
          bounceRate: parseFloat(metrics.bounceRate.toFixed(2)),
          unsubscribeRate: parseFloat(metrics.unsubscribeRate.toFixed(2))
        }
      });

      logger.info(`Updated metrics for campaign ${campaignId}`);

    } catch (error) {
      logger.error(`Failed to update campaign metrics for ${campaignId}:`, error);
      throw error;
    }
  }

  async getRealtimeMetrics(campaignId: string): Promise<any> {
    const pipeline = [
      { $match: { campaignId } },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          timeline: [
            {
              $project: {
                hour: {
                  $dateToString: {
                    format: '%Y-%m-%d %H:00',
                    date: '$createdAt'
                  }
                },
                status: 1
              }
            },
            {
              $group: {
                _id: { hour: '$hour', status: '$status' },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.hour': 1 } }
          ],
          engagement: [
            {
              $match: {
                $or: [
                  { openedAt: { $exists: true } },
                  { clickedAt: { $exists: true } }
                ]
              }
            },
            {
              $group: {
                _id: null,
                firstOpen: { $min: '$openedAt' },
                lastOpen: { $max: '$openedAt' },
                firstClick: { $min: '$clickedAt' },
                lastClick: { $max: '$clickedAt' }
              }
            }
          ]
        }
      }
    ];

    const [result] = await EmailTracking.aggregate(pipeline);
    return result;
  }
}

export const metricsAggregator = new MetricsAggregator();