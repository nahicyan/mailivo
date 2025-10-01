// api/src/controllers/SubjectTemplateController.ts
import { Response } from 'express';
import { SubjectTemplate } from '../models/SubjectTemplate.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { ServiceAuthRequest } from '../middleware/serviceAuth.middleware';

export const subjectTemplateController = {
  // GET /api/subject-templates - List all templates for user
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { enabled } = req.query;
      const filter: any = { userId };
      
      if (enabled !== undefined) {
        filter.isEnabled = enabled === 'true';
      }

      const templates = await SubjectTemplate.find(filter)
        .sort({ createdAt: -1 });

      // Convert to JSON to apply the toJSON transform (_id -> id)
      const templatesWithId = templates.map(template => template.toJSON());

      res.json({ success: true, templates: templatesWithId });
    } catch (error: any) {
      console.error('Error fetching subject templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  },

  // GET /api/subject-templates/:id - Get single template
  async get(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const template = await SubjectTemplate.findOne({ 
        _id: id, 
        userId 
      });

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json({ success: true, template: template.toJSON() });
    } catch (error: any) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  },

  // POST /api/subject-templates - Create new template
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { name, content, isEnabled = true, variables = [] } = req.body;

      if (!name || !content) {
        res.status(400).json({ error: 'Name and content are required' });
        return;
      }

      const template = new SubjectTemplate({
        name: name.trim(),
        content: content.trim(),
        isEnabled,
        variables,
        userId
      });

      await template.save();

      res.status(201).json({ 
        success: true, 
        template: template.toJSON(),
        message: 'Template created successfully'
      });
    } catch (error: any) {
      console.error('Error creating template:', error);
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: 'Invalid template data' });
      } else {
        res.status(500).json({ error: 'Failed to create template' });
      }
    }
  },

  // PUT /api/subject-templates/:id - Update template
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const updateData = { ...req.body };
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.content) updateData.content = updateData.content.trim();

      const template = await SubjectTemplate.findOneAndUpdate(
        { _id: id, userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json({ 
        success: true, 
        template: template.toJSON(),
        message: 'Template updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating template:', error);
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: 'Invalid template data' });
      } else {
        res.status(500).json({ error: 'Failed to update template' });
      }
    }
  },

  // DELETE /api/subject-templates/:id - Delete template
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const template = await SubjectTemplate.findOneAndDelete({ 
        _id: id, 
        userId 
      });

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json({ 
        success: true, 
        message: 'Template deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  },

  // NEW METHOD - Public endpoint for Landivo service
  async listPublic(_req: ServiceAuthRequest, res: Response): Promise<void> {
    try {
      // Fetch all enabled templates (not user-specific for public access)
      const templates = await SubjectTemplate.find({ 
        isEnabled: true 
      })
        .select('name content isEnabled variables createdAt')
        .sort({ createdAt: -1 })
        .limit(50);

      const templatesWithId = templates.map(template => template.toJSON());

      res.json({ success: true, templates: templatesWithId });
    } catch (error: any) {
      console.error('Error fetching public templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  },

  // PATCH /api/subject-templates/:id/toggle - Toggle template enabled status
  async toggle(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const template = await SubjectTemplate.findOne({ _id: id, userId });

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      template.isEnabled = !template.isEnabled;
      await template.save();

      res.json({ 
        success: true, 
        template: template.toJSON(),
        message: `Template ${template.isEnabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error: any) {
      console.error('Error toggling template:', error);
      res.status(500).json({ error: 'Failed to toggle template' });
    }
  }
};