// api/src/controllers/landivo-email-lists.controller.ts
import { Response } from 'express';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { landivoService } from '../services/landivo.service';

class LandivoEmailListsController {
  async getAllEmailLists(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      logger.info(`Fetching email lists from Landivo for user ${userId}`);
      
      const emailLists = await landivoService.getAllEmailLists();
      
      // Transform data for frontend consumption
      const transformedLists = emailLists.map(list => ({
        id: list.id,
        name: list.name,
        description: '',
        source: 'landivo',
        criteria: {},
        totalContacts: list.buyerCount,
        buyerCount: list.buyerCount,
        createdAt: new Date().toISOString(),
        sampleBuyers: [] // Will be populated when needed
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

      logger.info(`Fetching email list ${id} from Landivo for user ${userId}`);

      // Validate the email list exists first
      const validation = await landivoService.validateEmailList(id);
      if (!validation.valid) {
        res.status(404).json({ error: validation.error || 'Email list not found' });
        return;
      }

      // Get the contacts from the email list
      const contacts = await landivoService.getEmailListWithBuyers(id);
      
      // Get basic list info from the all lists endpoint (for metadata)
      const allLists = await landivoService.getAllEmailLists();
      const listInfo = allLists.find(list => list.id === id);

      const response = {
        id: id,
        name: listInfo?.name || 'Unknown List',
        description: '',
        source: 'landivo',
        criteria: {},
        totalContacts: contacts.length,
        buyerCount: contacts.length,
        createdAt: new Date().toISOString(),
        buyers: contacts.map(contact => ({
          id: contact.landivo_buyer_id,
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          phone: contact.phone,
          qualified: contact.subscribed,
          buyerType: 'CashBuyer'
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

      logger.info(`Fetching email list stats from Landivo for user ${userId}`);

      const emailLists = await landivoService.getAllEmailLists();
      
      const stats = {
        totalLists: emailLists.length,
        totalContacts: emailLists.reduce((sum, list) => sum + list.buyerCount, 0),
        averageContactsPerList: emailLists.length > 0 
          ? Math.round(emailLists.reduce((sum, list) => sum + list.buyerCount, 0) / emailLists.length)
          : 0,
        listsBySource: {
          landivo: emailLists.length,
          manual: 0
        }
      };

      res.json(stats);
      
    } catch (error) {
      logger.error('Error fetching email list stats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ 
        error: 'Failed to fetch email list stats',
        details: errorMessage 
      });
    }
  }

  // New method to check Landivo connection
  async checkConnection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const isConnected = await landivoService.checkConnection();
      
      res.json({ 
        connected: isConnected,
        status: isConnected ? 'OK' : 'Failed',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error checking Landivo connection:', error);
      res.status(500).json({ 
        connected: false,
        status: 'Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const landivoEmailListsController = new LandivoEmailListsController();