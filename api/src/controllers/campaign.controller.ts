// api/src/controllers/campaign.controller.ts
import { Response } from 'express';
import { Campaign } from '../models/Campaign';
import { EmailTemplate } from '../models/EmailTemplate.model';
import { emailService } from '../services/email.service';
import { landivoService } from '../services/landivoEmailList.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import axios from 'axios';

class CampaignController {
  async getAllCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status, search, source } = req.query;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const filter: any = { userId };

      if (status) filter.status = status;
      if (source) filter.source = source;
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

      // Resolve IDs to names
      const enrichedCampaigns = await this.enrichCampaignsWithNames(campaigns, userId);

      res.json({
        campaigns: enrichedCampaigns,
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

  private async enrichCampaignsWithNames(campaigns: any[], userId: any): Promise<any[]> {
    try {
      // Fetch all required data in parallel
      const [properties, emailLists, templates] = await Promise.all([
        this.fetchProperties(),
        this.fetchEmailLists(),
        this.fetchTemplates(userId)
      ]);

      // Create lookup maps for faster resolution
      const propertyMap = new Map(properties.map((p: any) => [p.id, p]));
      const emailListMap = new Map(emailLists.map((l: any) => [l.id, l]));
      const templateMap = new Map(templates.map((t: any) => [t.id || t._id, t]));

      // Enrich campaigns with names
      return campaigns.map(campaign => ({
        ...campaign,
        propertyName: this.getPropertyDisplayName(propertyMap.get(campaign.property)),
        emailListName: emailListMap.get(campaign.emailList)?.name || campaign.emailList,
        emailTemplateName: templateMap.get(campaign.emailTemplate)?.name || campaign.emailTemplate,
        // Keep original IDs for reference
        propertyId: campaign.property,
        emailListId: campaign.emailList,
        emailTemplateId: campaign.emailTemplate,
        // Update display fields
        property: this.getPropertyDisplayName(propertyMap.get(campaign.property)) || campaign.property,
        emailList: emailListMap.get(campaign.emailList)?.name || campaign.emailList,
        emailTemplate: templateMap.get(campaign.emailTemplate)?.name || campaign.emailTemplate,
      }));
    } catch (error) {
      logger.error('Error enriching campaigns with names:', error);
      // Return campaigns as-is if enrichment fails
      return campaigns;
    }
  }

  private getPropertyDisplayName(property: any): string {
    if (!property) return '';
    
    // Create a readable address format
    const parts = [
      property.streetAddress,
      property.city,
      property.state,
      property.zip
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  private async fetchProperties(): Promise<any[]> {
    try {
      const LANDIVO_API_URL = process.env.LANDIVO_API_URL || 'https://api.landivo.com';
      const response = await axios.get(`${LANDIVO_API_URL}/residency/allresd`, {
        timeout: 5000
      });
      return response.data || [];
    } catch (error) {
      logger.error('Error fetching properties for campaign enrichment:', error);
      return [];
    }
  }

  private async fetchEmailLists(): Promise<any[]> {
    try {
      const emailListsWithBuyers = await landivoService.getAllEmailLists();
      return emailListsWithBuyers.map(listData => ({
        id: listData.emailList.id,
        name: listData.emailList.name,
        description: listData.emailList.description
      }));
    } catch (error) {
      logger.error('Error fetching email lists for campaign enrichment:', error);
      return [];
    }
  }

  private async fetchTemplates(userId: any): Promise<any[]> {
    try {
      const templates = await EmailTemplate.find({ user_id: userId }).lean();
      return templates.map(template => ({
        id: template._id.toString(),
        _id: template._id.toString(),
        name: template.name
      }));
    } catch (error) {
      logger.error('Error fetching templates for campaign enrichment:', error);
      return [];
    }
  }

  async createCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const campaignData = {
        ...req.body,
        userId,
        source: req.body.source || 'manual',
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

      logger.info(`Campaign created: ${campaign._id}`, {
        userId: userId.toString(),
        campaignId: campaign._id,
        source: campaign.source
      });
      res.status(201).json(campaign);
    } catch (error) {
      logger.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
  
  async getCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const campaign = await Campaign.findOne({ _id: id, userId }).lean();
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      // Enrich single campaign with names
      const enrichedCampaigns = await this.enrichCampaignsWithNames([campaign], userId);
      res.json(enrichedCampaigns[0]);
    } catch (error) {
      logger.error('Error fetching campaign:', error);
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  }

  async updateCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;
      const updates = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const campaign = await Campaign.findOneAndUpdate(
        { _id: id, userId },
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      logger.info(`Campaign updated: ${id}`, { userId: userId.toString(), campaignId: id });
      res.json(campaign);
    } catch (error) {
      logger.error('Error updating campaign:', error);
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }

  async deleteCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const campaign = await Campaign.findOneAndDelete({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      logger.info(`Campaign deleted: ${id}`, { userId: userId.toString(), campaignId: id });
      res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      logger.error('Error deleting campaign:', error);
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  }

  async sendCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      if (campaign.status === 'sent') {
        res.status(400).json({ error: 'Campaign already sent' });
        return;
      }

      // Update status to sending
      campaign.status = 'sending';
      await campaign.save();

      // Queue email sending job
      await emailService.sendCampaign(campaign);

      logger.info(`Campaign sending initiated: ${id}`, { userId: userId.toString(), campaignId: id });
      res.json({ message: 'Campaign sending initiated', campaign });
    } catch (error) {
      logger.error('Error sending campaign:', error);
      res.status(500).json({ error: 'Failed to send campaign' });
    }
  }

  async pauseCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const campaign = await Campaign.findOneAndUpdate(
        { _id: id, userId },
        { status: 'paused', updatedAt: new Date() },
        { new: true }
      );

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      res.json({ message: 'Campaign paused', campaign });
    } catch (error) {
      logger.error('Error pausing campaign:', error);
      res.status(500).json({ error: 'Failed to pause campaign' });
    }
  }

  async resumeCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const campaign = await Campaign.findOneAndUpdate(
        { _id: id, userId },
        { status: 'active', updatedAt: new Date() },
        { new: true }
      );

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      res.json({ message: 'Campaign resumed', campaign });
    } catch (error) {
      logger.error('Error resuming campaign:', error);
      res.status(500).json({ error: 'Failed to resume campaign' });
    }
  }

  async duplicateCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const originalCampaign = await Campaign.findOne({ _id: id, userId });
      if (!originalCampaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
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

  async getCampaignAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
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
          mobileEngagement: campaign.metrics.open > 0 ? (campaign.metrics.mobileOpen / campaign.metrics.open * 100).toFixed(2) : 0
        }
      };

      res.json(analytics);
    } catch (error) {
      logger.error('Error fetching campaign analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  async getCampaignMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

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

  async bulkDeleteCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignIds } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

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

  async bulkSendCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignIds } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

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