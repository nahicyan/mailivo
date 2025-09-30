// api/src/controllers/mailivo-automation.controller.ts
import { Request, Response } from 'express';
import { MailivoAutomation, AutomationExecution } from '../models/MailivoAutomation';
import { AutomationValidator } from '../lib/automation-validation';
import { AutomationExecutor } from '../services/automation-executor.service';
import { logger } from '../utils/logger';

export class MailivoAutomationController {
  
  async getAllAutomations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { isActive, triggerType, page = 1, limit = 20 } = req.query;

      const query: any = { userId };
      
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }
      
      if (triggerType) {
        query['trigger.type'] = triggerType;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [automations, total] = await Promise.all([
        MailivoAutomation.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        MailivoAutomation.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: automations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      logger.error('Get automations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch automations',
        message: error.message
      });
    }
  }

  async getAutomation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const automation = await MailivoAutomation.findOne({ _id: id, userId });

      if (!automation) {
        res.status(404).json({
          success: false,
          error: 'Automation not found'
        });
        return;
      }

      res.json({
        success: true,
        data: automation
      });
    } catch (error: any) {
      logger.error('Get automation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch automation',
        message: error.message
      });
    }
  }

  async createAutomation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const automationData = req.body;

      const validation = AutomationValidator.validateAutomation({
        ...automationData,
        userId
      });

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Automation validation failed',
          errors: validation.errors,
          warnings: validation.warnings
        });
        return;
      }

      const automation = new MailivoAutomation({
        ...automationData,
        userId,
        stats: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0
        }
      });

      await automation.save();

      logger.info(`Automation created: ${automation._id} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: automation,
        warnings: validation.warnings
      });
    } catch (error: any) {
      logger.error('Create automation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create automation',
        message: error.message
      });
    }
  }

  async updateAutomation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const updates = req.body;

      const validation = AutomationValidator.validateAutomation({
        ...updates,
        userId
      });

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Automation validation failed',
          errors: validation.errors,
          warnings: validation.warnings
        });
        return;
      }

      const automation = await MailivoAutomation.findOneAndUpdate(
        { _id: id, userId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!automation) {
        res.status(404).json({
          success: false,
          error: 'Automation not found'
        });
        return;
      }

      logger.info(`Automation updated: ${id} by user ${userId}`);

      res.json({
        success: true,
        data: automation,
        warnings: validation.warnings
      });
    } catch (error: any) {
      logger.error('Update automation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update automation',
        message: error.message
      });
    }
  }

  async deleteAutomation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const automation = await MailivoAutomation.findOneAndDelete({ _id: id, userId });

      if (!automation) {
        res.status(404).json({
          success: false,
          error: 'Automation not found'
        });
        return;
      }

      await AutomationExecution.deleteMany({ automationId: id });

      logger.info(`Automation deleted: ${id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Automation deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete automation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete automation',
        message: error.message
      });
    }
  }

  async toggleAutomation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const { isActive } = req.body;

      const automation = await MailivoAutomation.findOne({ _id: id, userId });

      if (!automation) {
        res.status(404).json({
          success: false,
          error: 'Automation not found'
        });
        return;
      }

      if (isActive) {
        const validation = AutomationValidator.validateAutomation(automation.toObject() as any);
        if (!validation.isValid) {
          res.status(400).json({
            success: false,
            error: 'Cannot activate automation with validation errors',
            errors: validation.errors
          });
          return;
        }
      }

      automation.isActive = isActive;
      await automation.save();

      logger.info(`Automation ${isActive ? 'activated' : 'deactivated'}: ${id}`);

      res.json({
        success: true,
        data: automation,
        message: `Automation ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error: any) {
      logger.error('Toggle automation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle automation',
        message: error.message
      });
    }
  }

  async duplicateAutomation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const original = await MailivoAutomation.findOne({ _id: id, userId });

      if (!original) {
        res.status(404).json({
          success: false,
          error: 'Automation not found'
        });
        return;
      }

      const duplicate = new MailivoAutomation({
        ...original.toObject(),
        _id: undefined,
        name: `${original.name} (Copy)`,
        isActive: false,
        stats: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0
        },
        lastRunAt: undefined,
        createdAt: undefined,
        updatedAt: undefined
      });

      await duplicate.save();

      logger.info(`Automation duplicated: ${id} -> ${String(duplicate._id)}`);

      res.status(201).json({
        success: true,
        data: duplicate
      });
    } catch (error: any) {
      logger.error('Duplicate automation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to duplicate automation',
        message: error.message
      });
    }
  }

  async validateAutomation(req: Request, res: Response): Promise<void> {
    try {
      const automationData = req.body;

      const validation = AutomationValidator.validateAutomation(automationData);

      res.json({
        success: true,
        validation
      });
    } catch (error: any) {
      logger.error('Validate automation error:', error);
      res.status(500).json({
        success: false,
        error: 'Validation failed',
        message: error.message
      });
    }
  }

  async testAutomation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const { mockData } = req.body;

      const automation = await MailivoAutomation.findOne({ _id: id, userId });

      if (!automation) {
        res.status(404).json({
          success: false,
          error: 'Automation not found'
        });
        return;
      }

      const executor = new AutomationExecutor();
      const result = await executor.executeAutomation(automation.id.toString(), {
        testMode: true,
        mockData
      });

      res.json({
        success: true,
        data: result,
        message: 'Test execution completed'
      });
    } catch (error: any) {
      logger.error('Test automation error:', error);
      res.status(500).json({
        success: false,
        error: 'Test execution failed',
        message: error.message
      });
    }
  }

  async getAutomationExecutions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const { status, page = 1, limit = 20 } = req.query;

      const automation = await MailivoAutomation.findOne({ _id: id, userId });
      if (!automation) {
        res.status(404).json({
          success: false,
          error: 'Automation not found'
        });
        return;
      }

      const query: any = { automationId: id };
      if (status) {
        query.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [executions, total] = await Promise.all([
        AutomationExecution.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        AutomationExecution.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: executions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      logger.error('Get automation executions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch executions',
        message: error.message
      });
    }
  }

  async getExecutionDetails(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;
      const userId = (req as any).user?.id;

      const execution = await AutomationExecution.findOne({
        _id: executionId,
        userId
      }).populate('automationId');

      if (!execution) {
        res.status(404).json({
          success: false,
          error: 'Execution not found'
        });
        return;
      }

      res.json({
        success: true,
        data: execution
      });
    } catch (error: any) {
      logger.error('Get execution details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch execution details',
        message: error.message
      });
    }
  }

  async getAutomationStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const automation = await MailivoAutomation.findOne({ _id: id, userId });
      if (!automation) {
        res.status(404).json({
          success: false,
          error: 'Automation not found'
        });
        return;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentExecutions = await AutomationExecution.aggregate([
        {
          $match: {
            automationId: automation._id,
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const stats = {
        total: automation.stats,
        recent: recentExecutions.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Get automation stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch automation stats',
        message: error.message
      });
    }
  }
}

export const automationController = new MailivoAutomationController();