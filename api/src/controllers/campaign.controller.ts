import { Request, Response } from 'express';
import { Campaign } from '../models/Campaign';
import { emailService } from '../services/email.service';
import { landivoService } from '../services/landivo.service';
import { logger } from '../utils/logger';

class CampaignController {
  async getAllCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const userId = (req as any).user.id;

      const filter: any = { userId };
      
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { property: { $regex: search, $options: 'i' } }
        ];
      }

      const campaigns = await Campaign.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit) * Number(page))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await Campaign.countDocuments(filter);

      res.json({
        campaigns,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }

  async createCampaign(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const campaignData = {
        ...req.body,
        userId,
        status: 'draft',
        metrics: {
          open: 0,
          sent: 0,
          bounces: 0,
          successfulDeliveries: 0,
          clicks: 0,
          didNotOpen: 0,
          mobileOpen: 0
        }
      };

      const campaign = new Campaign(campaignData);
      await campaign.save();

      // Auto-populate name from property if not provided
      if (!campaign.name && campaign.property) {
        campaign.name = campaign.property;
        await campaign.save();
      }

      logger.info(`Campaign created: ${campaign._id}`, { userId, campaignId: campaign._id });
      res.status(201).json(campaign);
    } catch (error) {
      logger.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }

  async getCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      res.json(campaign);
    } catch (error) {
      logger.error('Error fetching campaign:', error);
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  }

  async updateCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updates = req.body;

      const campaign = await Campaign.findOneAndUpdate(
        { _id: id, userId },
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      logger.info(`Campaign updated: ${id}`, { userId, campaignId: id });
      res.json(campaign);
    } catch (error) {
      logger.error('Error updating campaign:', error);
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }

  async deleteCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const campaign = await Campaign.findOneAndDelete({ _id: id, userId });
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      logger.info(`Campaign deleted: ${id}`, { userId, campaignId: id });
      res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      logger.error('Error deleting campaign:', error);
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  }

  async sendCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.status === 'sent') {
        return res.status(400).json({ error: 'Campaign already sent' });
      }

      // Update status to sending
      campaign.status = 'sending';
      await campaign.save();

      // Queue email sending job
      await emailService.sendCampaign(campaign);

      logger.info(`Campaign sending initiated: ${id}`, { userId, campaignId: id });
      res.json({ message: 'Campaign sending initiated', campaign });
    } catch (error) {
      logger.error('Error sending campaign:', error);
      res.status(500).json({ error: 'Failed to send campaign' });
    }
  }

  async pauseCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const campaign = await Campaign.findOneAndUpdate(
        { _id: id, userId },
        { status: 'paused', updatedAt: new Date() },
        { new: true }
      );

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      res.json({ message: 'Campaign paused', campaign });
    } catch (error) {
      logger.error('Error pausing campaign:', error);
      res.status(500).json({ error: 'Failed to pause campaign' });
    }
  }

  async resumeCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const campaign = await Campaign.findOneAndUpdate(
        { _id: id, userId },
        { status: 'active', updatedAt: new Date() },
        { new: true }
      );

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      res.json({ message: 'Campaign resumed', campaign });
    } catch (error) {
      logger.error('Error resuming campaign:', error);
      res.status(500).json({ error: 'Failed to resume campaign' });
    }
  }

  async duplicateCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const originalCampaign = await Campaign.findOne({ _id: id, userId });
      if (!originalCampaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const duplicatedCampaign = new Campaign({
        ...originalCampaign.toObject(),
        _id: undefined,
        name: `${originalCampaign.name} (Copy)`,
        status: 'draft',
        metrics: {
          open: 0,
          sent: 0,
          bounces: 0,
          successfulDeliveries: 0,
          clicks: 0,
          didNotOpen: 0,
          mobileOpen: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await duplicatedCampaign.save();
      res.status(201).json(duplicatedCampaign);
    } catch (error) {
      logger.error('Error duplicating campaign:', error);
      res.status(500).json({ error: 'Failed to duplicate campaign' });
    }
  }

  async getCampaignAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const analytics = {
        campaign: campaign.name,
        metrics: campaign.metrics,
        performance: {
          openRate: campaign.metrics.sent > 0 ? (campaign.metrics.open / campaign.metrics.sent * 100).toFixed(2) : 0,
          clickRate: campaign.metrics.sent > 0 ? (campaign.metrics.clicks / campaign.metrics.sent * 100).toFixed(2) : 0,
          bounceRate: campaign.metrics.sent > 0 ? (campaign.metrics.bounces / campaign.metrics.sent * 100).toFixed(2) : 0,
          deliveryRate: campaign.metrics.sent > 0 ? (campaign.metrics.successfulDeliveries / campaign.metrics.sent * 100).toFixed(2) : 0
        },
        engagement: {
          totalEngagements: campaign.metrics.open + campaign.metrics.clicks,
          mobileEngagement: (campaign.metrics.mobileOpen / campaign.metrics.open * 100).toFixed(2) || 0
        }
      };

      res.json(analytics);
    } catch (error) {
      logger.error('Error fetching campaign analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  async getCampaignMetrics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      const metrics = await Campaign.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalCampaigns: { $sum: 1 },
            activeCampaigns: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            totalSent: { $sum: '$metrics.sent' },
            totalOpens: { $sum: '$metrics.open' },
            totalClicks: { $sum: '$metrics.clicks' },
            totalBounces: { $sum: '$metrics.bounces' }
          }
        }
      ]);

      const result = metrics[0] || {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalSent: 0,
        totalOpens: 0,
        totalClicks: 0,
        totalBounces: 0
      };

      result.averageOpenRate = result.totalSent > 0 ? (result.totalOpens / result.totalSent * 100).toFixed(2) : 0;
      result.averageClickRate = result.totalSent > 0 ? (result.totalClicks / result.totalSent * 100).toFixed(2) : 0;

      res.json(result);
    } catch (error) {
      logger.error('Error fetching campaign metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  }

  async bulkDeleteCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const { campaignIds } = req.body;
      const userId = (req as any).user.id;

      const result = await Campaign.deleteMany({
        _id: { $in: campaignIds },
        userId
      });

      res.json({ 
        message: `${result.deletedCount} campaigns deleted successfully`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      logger.error('Error bulk deleting campaigns:', error);
      res.status(500).json({ error: 'Failed to delete campaigns' });
    }
  }

  async bulkSendCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const { campaignIds } = req.body;
      const userId = (req as any).user.id;

      const campaigns = await Campaign.find({
        _id: { $in: campaignIds },
        userId,
        status: { $in: ['draft', 'paused'] }
      });

      for (const campaign of campaigns) {
        campaign.status = 'sending';
        await campaign.save();
        await emailService.sendCampaign(campaign);
      }

      res.json({ 
        message: `${campaigns.length} campaigns initiated for sending`,
        processedCount: campaigns.length
      });
    } catch (error) {
      logger.error('Error bulk sending campaigns:', error);
      res.status(500).json({ error: 'Failed to send campaigns' });
    }
  }
}

export const campaignController = new CampaignController();