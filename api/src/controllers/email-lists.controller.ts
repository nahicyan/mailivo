// api/src/controllers/email-lists.controller.ts
import { Response } from 'express';
import axios from 'axios';
import { EmailList } from '../models/EmailList';
import { logger } from '../utils/logger';
import { LandivoBuyer } from '../types/landivo';
import { AuthRequest } from '../middleware/auth.middleware';

const LANDIVO_API_URL = process.env.LANDIVO_API_URL || 'http://localhost:8200';

class EmailListsController {
  async getAllEmailLists(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const emailLists = await EmailList.find({ userId }).sort({ createdAt: -1 });
      res.json(emailLists);
    } catch (error) {
      logger.error('Error fetching email lists:', error);
      res.status(500).json({ error: 'Failed to fetch email lists' });
    }
  }

  async createEmailList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { name, description, buyerCriteria } = req.body;

      // Fetch buyers from Landivo based on criteria
      const buyers = await this.fetchBuyersFromLandivo(buyerCriteria);

      const emailList = new EmailList({
        name,
        description,
        userId,
        buyerCriteria,
        buyers: buyers.map(buyer => ({
          landivoBuyerId: buyer.id,
          email: buyer.email,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          phone: buyer.phone,
          qualified: buyer.qualified,
          preferences: {
            subscribed: true,
            priceRange: {
              min: buyerCriteria?.minPrice || 0,
              max: buyerCriteria?.maxPrice || 999999999
            }
          }
        })),
        totalContacts: buyers.length
      });

      await emailList.save();
      res.status(201).json(emailList);
    } catch (error) {
      logger.error('Error creating email list:', error);
      res.status(500).json({ error: 'Failed to create email list' });
    }
  }

  async getEmailList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const emailList = await EmailList.findOne({ _id: id, userId });
      if (!emailList) {
        res.status(404).json({ error: 'Email list not found' });
        return;
      }

      res.json(emailList);
    } catch (error) {
      logger.error('Error fetching email list:', error);
      res.status(500).json({ error: 'Failed to fetch email list' });
    }
  }

  async updateEmailList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;
      const updates = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const emailList = await EmailList.findOneAndUpdate(
        { _id: id, userId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      if (!emailList) {
        res.status(404).json({ error: 'Email list not found' });
        return;
      }

      res.json(emailList);
    } catch (error) {
      logger.error('Error updating email list:', error);
      res.status(500).json({ error: 'Failed to update email list' });
    }
  }

  async deleteEmailList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const emailList = await EmailList.findOneAndDelete({ _id: id, userId });
      if (!emailList) {
        res.status(404).json({ error: 'Email list not found' });
        return;
      }

      res.json({ message: 'Email list deleted successfully' });
    } catch (error) {
      logger.error('Error deleting email list:', error);
      res.status(500).json({ error: 'Failed to delete email list' });
    }
  }

  async syncBuyersFromLandivo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const emailList = await EmailList.findOne({ _id: id, userId });
      if (!emailList) {
        res.status(404).json({ error: 'Email list not found' });
        return;
      }

      // Fetch updated buyers from Landivo
      const buyers = await this.fetchBuyersFromLandivo(emailList.buyerCriteria);

      emailList.buyers = buyers.map(buyer => ({
        landivoBuyerId: buyer.id,
        email: buyer.email,
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        phone: buyer.phone,
        qualified: buyer.qualified,
        preferences: {
          subscribed: true,
          priceRange: {
            min: emailList.buyerCriteria?.minPrice || 0,
            max: emailList.buyerCriteria?.maxPrice || 999999999
          }
        }
      }));

      emailList.totalContacts = buyers.length;
      emailList.lastSyncAt = new Date();
      await emailList.save();

      res.json({ 
        message: 'Buyers synced successfully',
        totalContacts: buyers.length 
      });
    } catch (error) {
      logger.error('Error syncing buyers:', error);
      res.status(500).json({ error: 'Failed to sync buyers' });
    }
  }

  private async fetchBuyersFromLandivo(criteria?: any): Promise<LandivoBuyer[]> {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/buyer/all`);
      let buyers: LandivoBuyer[] = response.data;

      // Apply filtering based on criteria
      if (criteria) {
        buyers = buyers.filter(buyer => {
          if (criteria.qualified && !buyer.qualified) return false;
          if (criteria.minIncome && buyer.grossAnnualIncome && 
              parseInt(buyer.grossAnnualIncome) < criteria.minIncome) return false;
          if (criteria.creditScore && buyer.currentCreditScore &&
              parseInt(buyer.currentCreditScore) < criteria.creditScore) return false;
          return true;
        });
      }

      return buyers;
    } catch (error) {
      logger.error('Error fetching buyers from Landivo:', error);
      return [];
    }
  }
}

export const emailListsController = new EmailListsController();