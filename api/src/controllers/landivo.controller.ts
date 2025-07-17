import { Request, Response } from 'express';
import axios from 'axios';

const LANDIVO_API_URL = process.env.LANDIVO_API_URL || 'http://localhost:8200';

export const landivoController = {
  async getProperties(req: Request, res: Response) {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/api/residency`);
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching properties from Landivo:', error);
      res.status(500).json({ 
        error: 'Failed to fetch properties',
        details: error.response?.data || error.message 
      });
    }
  },

  async getProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const response = await axios.get(`${LANDIVO_API_URL}/api/residency/${id}`);
      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching property ${req.params.id}:`, error);
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Property not found' });
      }
      res.status(500).json({ 
        error: 'Failed to fetch property',
        details: error.response?.data || error.message 
      });
    }
  },

  async getPropertyBuyers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const response = await axios.get(`${LANDIVO_API_URL}/api/buyer?propertyId=${id}`);
      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching buyers for property ${req.params.id}:`, error);
      res.json([]);
    }
  },

  async getAllBuyers(req: Request, res: Response) {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/api/buyer`);
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching all buyers:', error);
      res.status(500).json({ 
        error: 'Failed to fetch buyers',
        details: error.response?.data || error.message 
      });
    }
  },

  async syncProperties(req: Request, res: Response) {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/api/residency`);
      res.json({ 
        message: 'Properties synced successfully',
        count: response.data?.length || 0 
      });
    } catch (error) {
      console.error('Error syncing properties:', error);
      res.status(500).json({ 
        error: 'Failed to sync properties',
        details: error.response?.data || error.message 
      });
    }
  }
};