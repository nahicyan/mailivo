// api/src/controllers/properties.controller.ts
import { Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import { LandivoProperty } from '../types/landivo';

const LANDIVO_API_URL = process.env.LANDIVO_API_URL || 'http://localhost:8200';

class PropertiesController {
  async getAllProperties(_req: Request, res: Response) {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/residency/allresd`);
      const properties: LandivoProperty[] = response.data;
      
      // Return formatted addresses for dropdown
      const formattedProperties = properties.map(property => ({
        id: property.id,
        address: `${property.streetAddress}, ${property.city}, ${property.state} ${property.zip}`,
        title: property.title,
        price: property.askingPrice,
        type: property.landType,
        acre: property.acre
      }));

      res.json(formattedProperties);
    } catch (error) {
      logger.error('Error fetching properties from Landivo:', error);
      res.status(500).json({ error: 'Failed to fetch properties' });
    }
  }

  async getProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const response = await axios.get(`${LANDIVO_API_URL}/residency/${id}`);
      res.json(response.data);
    } catch (error) {
      logger.error(`Error fetching property ${req.params.id}:`, error);
      res.status(404).json({ error: 'Property not found' });
    }
  }

  async syncFromLandivo(_req: Request, res: Response) {
    try {
      const response = await axios.get(`${LANDIVO_API_URL}/residency/allresd`);
      const properties: LandivoProperty[] = response.data;
      
      // Store sync metadata or process properties as needed
      logger.info(`Synced ${properties.length} properties from Landivo`);
      
      res.json({ 
        message: 'Properties synced successfully',
        count: properties.length,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error syncing properties:', error);
      res.status(500).json({ error: 'Failed to sync properties' });
    }
  }
}

export const propertiesController = new PropertiesController();