// api/src/controllers/campaign.controller.ts
import { Response } from 'express';
import { Campaign } from '../models/Campaign.model';
import { Contact } from '../models/Contact.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const campaignController = {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const filter: any = { user_id: req.user!._id };
      
      if (status) filter.status = status;

      const campaigns = await Campaign.find(filter)
        .sort({ created_at: -1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit));

      const total = await Campaign.countDocuments(filter);

      res.json({
        campaigns,
        pagination: {
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  },

  async get(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const campaign = await Campaign.findOne({ 
        _id: id, 
        user_id: req.user!._id 
      });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      res.json({ campaign });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  },

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const campaign = new Campaign({
        ...req.body,
        user_id: req.user!._id,
      });

      await campaign.save();
      res.status(201).json({ campaign });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const campaign = await Campaign.findOneAndUpdate(
        { _id: id, user_id: req.user!._id },
        { $set: req.body },
        { new: true }
      );

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      res.json({ campaign });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const campaign = await Campaign.findOneAndDelete({ 
        _id: id, 
        user_id: req.user!._id 
      });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  },

  async send(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const campaign = await Campaign.findOne({ 
        _id: id, 
        user_id: req.user!._id 
      });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      // Get recipients based on targeting
      const contacts = await Contact.find({
        user_id: req.user!._id,
        'preferences.subscribed': true,
        segments: { $in: campaign.targeting.segments }
      });

      // Update campaign status
      campaign.status = 'sending';
      campaign.targeting.total_recipients = contacts.length;
      await campaign.save();

      // Queue email sending job (implement with Bull)
      // await emailQueue.add('sendCampaign', { campaignId: id, contacts });

      res.json({ message: 'Campaign queued for sending', recipients: contacts.length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send campaign' });
    }
  }
};