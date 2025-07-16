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
      res.json({ templates });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  },

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const template = new EmailTemplate({
        ...req.body,
        user_id: req.user!._id,
      });

      await template.save();
      res.status(201).json({ template });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create template' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const template = await EmailTemplate.findOneAndUpdate(
        { _id: id, user_id: req.user!._id },
        { $set: req.body },
        { new: true }
      );

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json({ template });
    } catch (error) {
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
      res.status(500).json({ error: 'Failed to delete template' });
    }
  },
};