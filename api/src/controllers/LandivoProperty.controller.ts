import { Request, Response, RequestHandler } from 'express';
import axios, { AxiosError } from 'axios';

const LANDIVO_API_URL = process.env.LANDIVO_API_URL || 'http://localhost:8200';

interface LandivoController {
  getProperties: RequestHandler;
  getProperty: RequestHandler;
  getPropertyBuyers: RequestHandler;
  getAllBuyers: RequestHandler;
  syncProperties: RequestHandler;
}

export const landivoController: LandivoController = {
  async getProperties(_req: Request, res: Response) {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/residency`);
      res.json(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching properties from Landivo:', error);
      res.status(500).json({ 
        error: 'Failed to fetch properties',
        details: axiosError.response?.data || axiosError.message 
      });
    }
  },

  async getProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const response = await axios.get(`${LANDIVO_API_URL}/residency/${id}`);
      res.json(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Error fetching property ${req.params.id}:`, error);
      if (axiosError.response?.status === 404) {
        res.status(404).json({ error: 'Property not found' });
        return;
      }
      res.status(500).json({ 
        error: 'Failed to fetch property',
        details: axiosError.response?.data || axiosError.message 
      });
    }
  },

  async getPropertyBuyers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const response = await axios.get(`${LANDIVO_API_URL}/buyer?propertyId=${id}`);
      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching buyers for property ${req.params.id}:`, error);
      res.json([]);
    }
  },

  async getAllBuyers(_req: Request, res: Response) {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/buyer`);
      res.json(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching all buyers:', error);
      res.status(500).json({ 
        error: 'Failed to fetch buyers',
        details: axiosError.response?.data || axiosError.message 
      });
    }
  },

  async syncProperties(_req: Request, res: Response) {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/residency`);
      res.json({ 
        message: 'Properties synced successfully',
        count: response.data?.length || 0 
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error syncing properties:', error);
      res.status(500).json({ 
        error: 'Failed to sync properties',
        details: axiosError.response?.data || axiosError.message 
      });
    }
  }
};