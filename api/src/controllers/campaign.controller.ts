// api/src/controllers/campaign.controller.ts
import { Request, Response } from 'express';
import { Campaign } from '../models/Campaign.model';
import { Contact } from '../models/Contact.model';
import { EmailTracking } from '../models/EmailTracking.model';
import { emailQueueService } from '../services/emailQueue.service';
import { emailService } from '../services/email.service';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: { _id: string };
}

class CampaignController {
  // Get all campaigns for user
  async getCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const campaigns = await Campaign.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      res.json(campaigns);
    } catch (error) {
      logger.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }

  // Create new campaign
  async createCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Validate required fields
      const { name, subject, htmlContent } = req.body;
      if (!name || !subject || !htmlContent) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Check spam score before creating
      const spamScore = await emailService.checkSpamScore(htmlContent, subject);
      if (spamScore > 7) {
        res.status(400).json({ 
          error: 'Content has high spam score', 
          spamScore,
          suggestions: [
            'Reduce excessive capitalization',
            'Remove spam trigger words',
            'Balance text and HTML content',
            'Reduce number of links'
          ]
        });
        return;
      }

      const campaignData = {
        ...req.body,
        userId,
        status: 'draft',
        spamScore,
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          complained: 0,
          totalRecipients: 0,
        }
      };

      const campaign = new Campaign(campaignData);
      await campaign.save();

      logger.info(`Campaign created: ${campaign._id}`, { userId, spamScore });
      res.status(201).json(campaign);
    } catch (error) {
      logger.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }

  // Get single campaign
  async getCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      res.json(campaign);
    } catch (error) {
      logger.error('Error fetching campaign:', error);
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  }

  // Send campaign - REAL IMPLEMENTATION
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

      if (campaign.status === 'sending') {
        res.status(400).json({ error: 'Campaign is currently sending' });
        return;
      }

      // Validate campaign content
      if (!campaign.subject || !campaign.htmlContent) {
        res.status(400).json({ error: 'Campaign missing content' });
        return;
      }

      // Check deliverability metrics
      const reputation = await emailService.checkDomainReputation();
      if (reputation.reputationScore < 6) {
        res.status(400).json({ 
          error: 'Domain reputation too low for sending',
          reputation 
        });
        return;
      }

      // Validate recipient count
      let recipientCount = 0;
      if (campaign.audienceType === 'all') {
        recipientCount = await Contact.countDocuments({ 
          userId, 
          subscribed: true 
        });
      } else if (campaign.audienceType === 'segment') {
        recipientCount = await Contact.countDocuments({
          userId,
          segments: { $in: campaign.segments },
          subscribed: true,
        });
      } else if (campaign.audienceType === 'landivo') {
        // Count would come from Landivo integration
        recipientCount = campaign.estimatedRecipients || 0;
      }

      if (recipientCount === 0) {
        res.status(400).json({ error: 'No recipients found for this campaign' });
        return;
      }

      // Start sending process
      await emailQueueService.sendCampaign(id, userId);
      
      // Update campaign status
      campaign.status = 'sending';
      campaign.sentAt = new Date();
      await campaign.save();

      logger.info(`Campaign sending initiated: ${id}`, { 
        userId, 
        recipientCount 
      });

      res.json({ 
        message: 'Campaign sending initiated',
        recipientCount,
        status: 'sending'
      });

    } catch (error) {
      logger.error('Error sending campaign:', error);
      res.status(500).json({ error: 'Failed to send campaign' });
    }
  }

  // Send test email
  async sendTestEmail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { testEmail } = req.body;
      const userId = req.user?._id;

      if (!testEmail || !emailService.validateEmail(testEmail)) {
        res.status(400).json({ error: 'Valid test email required' });
        return;
      }

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      await emailService.sendEmail({
        to: testEmail,
        subject: `[TEST] ${campaign.subject}`,
        html: campaign.htmlContent,
        text: campaign.textContent,
      });

      res.json({ message: 'Test email sent successfully' });
    } catch (error) {
      logger.error('Error sending test email:', error);
      res.status(500).json({ error: 'Failed to send test email' });
    }
  }

  // Pause campaign
  async pauseCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      if (campaign.status !== 'sending') {
        res.status(400).json({ error: 'Campaign is not currently sending' });
        return;
      }

      await emailQueueService.pauseCampaign(id);
      
      campaign.status = 'paused';
      await campaign.save();

      res.json({ message: 'Campaign paused successfully' });
    } catch (error) {
      logger.error('Error pausing campaign:', error);
      res.status(500).json({ error: 'Failed to pause campaign' });
    }
  }

  // Get campaign analytics
  async getCampaignAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const campaign = await Campaign.findOne({ _id: id, userId });
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      // Get detailed tracking data
      const trackingData = await EmailTracking.aggregate([
        { $match: { campaignId: id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            emails: { $push: '$contactId' }
          }
        }
      ]);

      // Get open/click timeline
      const timeline = await EmailTracking.aggregate([
        { $match: { campaignId: id, $or: [{ openedAt: { $exists: true } }, { clickedAt: { $exists: true } }] } },
        {
          $project: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d %H:00',
                date: { $ifNull: ['$openedAt', '$clickedAt'] }
              }
            },
            type: { $cond: { if: '$openedAt', then: 'open', else: 'click' } }
          }
        },
        { $group: { _id: { date: '$date', type: '$type' }, count: { $sum: 1 } } },
        { $sort: { '_id.date': 1 } }
      ]);

      const analytics = {
        campaign: campaign.toObject(),
        tracking: trackingData,
        timeline,
        deliverabilityScore: campaign.spamScore ? 10 - campaign.spamScore : 8,
      };

      res.json(analytics);
    } catch (error) {
      logger.error('Error fetching campaign analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  // Get queue status
  async getQueueStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await emailQueueService.getQueueStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error fetching queue status:', error);
      res.status(500).json({ error: 'Failed to fetch queue status' });
    }
  }
}

export const campaignController = new CampaignController();