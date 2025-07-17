import { Request, Response } from 'express';
import axios from 'axios';

const LANDIVO_API_URL = process.env.LANDIVO_API_URL || 'http://localhost:8200';

export const landivoController = {
  async getProperties(req: Request, res: Response) {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/api/residency`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
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
      const response = await axios.get(`${LANDIVO_API_URL}/api/residency/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
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
      const response = await axios.get(`${LANDIVO_API_URL}/api/buyer/property/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching buyers for property ${req.params.id}:`, error);
      
      // Return empty array if buyers endpoint fails
      res.json([]);
    }
  },

  async getAllBuyers(req: Request, res: Response) {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/api/buyer`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
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
      // Fetch all properties and store/update in your database if needed
      const response = await axios.get(`${LANDIVO_API_URL}/api/residency`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      
      // Here you could save to your MongoDB if you want to cache
      // const properties = response.data;
      // await Property.insertMany(properties, { upsert: true });
      
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