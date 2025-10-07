// api/src/controllers/template.controller.ts
import { Response } from 'express';
import { EmailTemplate } from '../models/EmailTemplate.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const templateController = {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      const filter: any = { user_id: req.user!._id };
      
      if (category) filter.category = category;

      const templates = await EmailTemplate.find(filter).sort({ updatedAt: -1 });
      
      // Map _id to id for frontend compatibility
      const templatesWithId = templates.map(template => ({
        ...template.toObject(),
        id: (template._id as any).toString()
      }));
      
      res.json({ templates: templatesWithId });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  },

  async get(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const template = await EmailTemplate.findOne({ 
        _id: id, 
        user_id: req.user!._id 
      });

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      // Map _id to id for frontend compatibility
      const templateWithId = {
        ...template.toObject(),
        id: (template._id as any).toString()
      };

      res.json({ template: templateWithId });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  },

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, components, description, category, type, settings } = req.body;
      
      // Validate required fields
      if (!name || name.trim().length === 0) {
        res.status(400).json({ 
          error: 'Validation failed',
          message: 'Template name is required',
          field: 'name'
        });
        return;
      }

      if (!components || !Array.isArray(components) || components.length === 0) {
        res.status(400).json({ 
          error: 'Validation failed',
          message: 'Template must have at least one component',
          field: 'components'
        });
        return;
      }

      const template = new EmailTemplate({
        name: name.trim(),
        description,
        category: category || 'custom',
        type: type || 'single', 
        components,
        settings: settings || {},
        user_id: req.user!._id,
      });

      await template.save();
      
      // Map _id to id for frontend compatibility
      const templateWithId = {
        ...template.toObject(),
        id: (template._id as any).toString()
      };
      
      res.status(201).json({ template: templateWithId });
    } catch (error: any) {
      console.error('Error creating template:', error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        res.status(409).json({ 
          error: 'Template name already exists',
          message: 'A template with this name already exists',
          field: 'name'
        });
        return;
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message
        }));
        
        res.status(400).json({ 
          error: 'Validation failed',
          message: validationErrors[0]?.message || 'Validation failed',
          validationErrors
        });
        return;
      }

      res.status(500).json({  error: 'Failed to create template' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, components } = req.body;

      // Validate required fields for updates
      if (name !== undefined && (!name || name.trim().length === 0)) {
        res.status(400).json({ 
          error: 'Validation failed',
          message: 'Template name cannot be empty',
          field: 'name'
        });
        return;
      }

      if (components !== undefined && (!components || components.length === 0)) {
        res.status(400).json({ 
          error: 'Validation failed',
          message: 'Template must have at least one component',
          field: 'components'
        });
        return;
      }

      const updateData = { ...req.body };
      if (name) {
        updateData.name = name.trim();
      }

      const template = await EmailTemplate.findOneAndUpdate(
        { _id: id, user_id: req.user!._id },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      // Map _id to id for frontend compatibility
      const templateWithId = {
        ...template.toObject(),
        id: (template._id as any).toString()
      };

      res.json({ template: templateWithId });
    } catch (error: any) {
      console.error('Error updating template:', error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        res.status(409).json({ 
          error: 'Template name already exists',
          message: 'A template with this name already exists',
          field: 'name'
        });
        return;
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message
        }));
        
        res.status(400).json({ 
          error: 'Validation failed',
          message: validationErrors[0]?.message || 'Validation failed',
          validationErrors
        });
        return;
      }

      res.status(500).json({ error: 'Failed to update template' });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const template = await EmailTemplate.findOneAndDelete({ 
        _id: id, 
        user_id: req.user!._id 
      });

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  },
};