// api/src/controllers/landivo-email-lists.controller.ts
import { Response } from 'express';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { landivoService } from '../services/landivoEmailList.service';

class LandivoEmailListsController {
  async getAllEmailLists(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      logger.info(`Fetching email lists from Landivo for user ${userId}`);
      
      const emailListsWithBuyers = await landivoService.getAllEmailLists();
      
      // Transform data for frontend consumption
      const transformedLists = emailListsWithBuyers.map(listData => ({
        id: listData.emailList.id,
        name: listData.emailList.name,
        description: listData.emailList.description || '',
        source: listData.emailList.source,
        criteria: listData.emailList.criteria,
        totalContacts: listData.totalContacts,
        createdAt: listData.emailList.createdAt,
        // Include sample buyers for preview (first 5)
        sampleBuyers: listData.buyers.slice(0, 5).map(buyer => ({
          id: buyer.id,
          email: buyer.email,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          qualified: buyer.qualified
        }))
      }));

      res.json(transformedLists);
      
    } catch (error) {
      logger.error('Error fetching email lists from Landivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ 
        error: 'Failed to fetch email lists from Landivo',
        details: errorMessage 
      });
    }
  }

  async getEmailListById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const emailListData = await landivoService.getEmailListById(id);
      
      if (!emailListData) {
        res.status(404).json({ error: 'Email list not found' });
        return;
      }

      const response = {
        id: emailListData.emailList.id,
        name: emailListData.emailList.name,
        description: emailListData.emailList.description || '',
        source: emailListData.emailList.source,
        criteria: emailListData.emailList.criteria,
        totalContacts: emailListData.totalContacts,
        createdAt: emailListData.emailList.createdAt,
        buyers: emailListData.buyers.map(buyer => ({
          id: buyer.id,
          email: buyer.email,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          phone: buyer.phone,
          qualified: buyer.qualified,
          buyerType: buyer.buyerType
        }))
      };

      res.json(response);
      
    } catch (error) {
      logger.error(`Error fetching email list ${req.params.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ 
        error: 'Failed to fetch email list',
        details: errorMessage 
      });
    }
  }

  async getEmailListStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const emailListsWithBuyers = await landivoService.getAllEmailLists();
      
      const stats = {
        totalLists: emailListsWithBuyers.length,
        totalContacts: emailListsWithBuyers.reduce((sum, list) => sum + list.totalContacts, 0),
        averageContactsPerList: emailListsWithBuyers.length > 0 
          ? Math.round(emailListsWithBuyers.reduce((sum, list) => sum + list.totalContacts, 0) / emailListsWithBuyers.length)
          : 0,
        listsBySource: emailListsWithBuyers.reduce((acc, list) => {
          acc[list.emailList.source] = (acc[list.emailList.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      res.json(stats);
      
    } catch (error) {
      logger.error('Error fetching email list stats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ 
        error: 'Failed to fetch email list statistics',
        details: errorMessage 
      });
    }
  }
}

export const landivoEmailListsController = new LandivoEmailListsController();