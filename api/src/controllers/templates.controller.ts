import { Request, Response } from 'express';
import { Template } from '../models/Template';
import { logger } from '../utils/logger';

class TemplatesController {
  getAllTemplates = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const templates = await Template.find({ userId }).sort({ createdAt: -1 });
      
      // Include default system templates
      const systemTemplates = [
        {
          id: 'new-listing',
          name: 'New Listing Announcement',
          type: 'system',
          description: 'Professional template for new property listings'
        },
        {
          id: 'price-drop',
          name: 'Price Drop Alert',
          type: 'system',
          description: 'Alert buyers about price reductions'
        },
        {
          id: 'open-house',
          name: 'Open House Invitation',
          type: 'system',
          description: 'Invite prospects to open house events'
        }
      ];

      res.json([...systemTemplates, ...templates]);
    } catch (error) {
      logger.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  }

  createTemplate = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { name, content, type, description } = req.body;

      const template = new Template({
        name,
        content,
        type: type || 'custom',
        description,
        userId
      });

      await template.save();
      res.status(201).json(template);
    } catch (error) {
      logger.error('Error creating template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  }

  getTemplate = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      // Handle system templates
      if (id.startsWith('system-') || ['new-listing', 'price-drop', 'open-house'].includes(id)) {
        const systemTemplate = this.getSystemTemplate(id);
        return res.json(systemTemplate);
      }

      const template = await Template.findOne({ _id: id, userId });
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      logger.error('Error fetching template:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  }

  updateTemplate = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updates = req.body;

      const template = await Template.findOneAndUpdate(
        { _id: id, userId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      logger.error('Error updating template:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  }

  deleteTemplate = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const template = await Template.findOneAndDelete({ _id: id, userId });
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      logger.error('Error deleting template:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  }

  private getSystemTemplate = (id: string) => {
    const templates = {
      'new-listing': {
        id: 'new-listing',
        name: 'New Listing Announcement',
        type: 'system',
        content: `
          <h1>New Property Available!</h1>
          <p>{{property.title}}</p>
          <p>Address: {{property.streetAddress}}, {{property.city}}, {{property.state}}</p>
          <p>Price: ${{property.askingPrice}}</p>
          <p>Size: {{property.acre}} acres</p>
          <p>{{property.description}}</p>
        `,
        description: 'Professional template for new property listings'
      },
      'price-drop': {
        id: 'price-drop',
        name: 'Price Drop Alert',
        type: 'system',
        content: `
          <h1>Price Reduced!</h1>
          <p>Great news! The price for {{property.title}} has been reduced.</p>
          <p>New Price: ${{property.askingPrice}}</p>
          <p>Don't miss this opportunity!</p>
        `,
        description: 'Alert buyers about price reductions'
      },
      'open-house': {
        id: 'open-house',
        name: 'Open House Invitation',
        type: 'system',
        content: `
          <h1>You're Invited to Our Open House!</h1>
          <p>Property: {{property.title}}</p>
          <p>Date: {{event.date}}</p>
          <p>Time: {{event.time}}</p>
          <p>Address: {{property.streetAddress}}</p>
        `,
        description: 'Invite prospects to open house events'
      }
    };

    return templates[id as keyof typeof templates] || null;
  }
}

export const templatesController = new TemplatesController();