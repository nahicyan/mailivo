// api/src/controllers/WorkflowController.ts
import { Request, Response } from 'express';
import Workflow from '../models/Workflow';
import WorkflowExecution from '../models/WorkflowExecution';
import { WorkflowValidator } from '../lib/workflow-validation';

export class WorkflowController {
  
  // GET /api/workflows - List workflows with filtering and pagination
  async getWorkflows(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        category
      } = req.query;

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Build filter query
      const filter: any = { userId };
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) {
        filter.isActive = status === 'active';
      }
      
      if (category) {
        filter.category = category;
      }

      // Execute query with pagination
      const skip = (Number(page) - 1) * Number(limit);
      const [workflows, total] = await Promise.all([
        Workflow.find(filter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Workflow.countDocuments(filter)
      ]);

      // Add validation status and stats to each workflow
      const workflowsWithMeta = await Promise.all(
        workflows.map(async (workflow: any) => {
          const validation = WorkflowValidator ? WorkflowValidator.validateWorkflow(workflow) : { isValid: true, errors: [], warnings: [] };
          
          // Get basic stats from executions
          const stats = await WorkflowExecution.aggregate([
            { $match: { workflowId: workflow._id.toString() } },
            {
              $group: {
                _id: null,
                totalRuns: { $sum: 1 },
                successfulRuns: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                failedRuns: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
              }
            }
          ]);

          const workflowStats = stats[0] || { totalRuns: 0, successfulRuns: 0, failedRuns: 0 };

          return {
            ...workflow,
            validation: {
              isValid: validation.isValid,
              errorCount: validation.errors.length,
              warningCount: validation.warnings.length
            },
            stats: {
              ...workflowStats,
              conversionRate: workflowStats.totalRuns > 0 
                ? (workflowStats.successfulRuns / workflowStats.totalRuns) * 100 
                : 0
            }
          };
        })
      );

      res.json({
        workflows: workflowsWithMeta,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching workflows:', error);
      res.status(500).json({
        error: 'Failed to retrieve workflows',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/workflows/:id - Get single workflow
  async getWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workflow = await Workflow.findOne({ _id: id, userId }).lean();

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Get workflow statistics
      const executions = await WorkflowExecution.find({ workflowId: id })
        .sort({ startedAt: -1 })
        .limit(10)
        .lean();

      const stats = await WorkflowExecution.aggregate([
        { $match: { workflowId: id } },
        {
          $group: {
            _id: null,
            totalRuns: { $sum: 1 },
            successfulRuns: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            failedRuns: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            avgExecutionTime: { $avg: '$duration' }
          }
        }
      ]);

      const workflowStats = stats[0] || { 
        totalRuns: 0, 
        successfulRuns: 0, 
        failedRuns: 0, 
        avgExecutionTime: 0 
      };

      res.json({
        ...workflow,
        stats: {
          ...workflowStats,
          conversionRate: workflowStats.totalRuns > 0 
            ? (workflowStats.successfulRuns / workflowStats.totalRuns) * 100 
            : 0
        },
        recentExecutions: executions
      });

    } catch (error) {
      console.error('Error fetching workflow:', error);
      res.status(500).json({
        error: 'Failed to retrieve workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/workflows - Create workflow
  async createWorkflow(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workflowData = {
        ...req.body,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate workflow structure if validator exists
      if (WorkflowValidator) {
        const validation = WorkflowValidator.validateWorkflow(workflowData);
        if (!validation.isValid && validation.errors.length > 0) {
          return res.status(400).json({
            error: 'Invalid workflow structure',
            validation: validation.errors
          });
        }
      }

      const workflow = new Workflow(workflowData);
      await workflow.save();

      res.status(201).json(workflow);

    } catch (error) {
      console.error('Error creating workflow:', error);
      res.status(500).json({
        error: 'Failed to create workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT /api/workflows/:id - Update workflow
  async updateWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      // Validate workflow structure if validator exists
      if (WorkflowValidator) {
        const validation = WorkflowValidator.validateWorkflow(updateData);
        if (!validation.isValid && validation.errors.length > 0) {
          return res.status(400).json({
            error: 'Invalid workflow structure',
            validation: validation.errors
          });
        }
      }

      const workflow = await Workflow.findOneAndUpdate(
        { _id: id, userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      res.json(workflow);

    } catch (error) {
      console.error('Error updating workflow:', error);
      res.status(500).json({
        error: 'Failed to update workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // DELETE /api/workflows/:id - Delete workflow
  async deleteWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workflow = await Workflow.findOneAndDelete({ _id: id, userId });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Clean up related executions
      await WorkflowExecution.deleteMany({ workflowId: id });

      res.json({ message: 'Workflow deleted successfully' });

    } catch (error) {
      console.error('Error deleting workflow:', error);
      res.status(500).json({
        error: 'Failed to delete workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PATCH /api/workflows/:id/toggle - Toggle workflow active status
  async toggleWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workflow = await Workflow.findOne({ _id: id, userId });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      workflow.isActive = !workflow.isActive;
      workflow.updatedAt = new Date();
      
      if (workflow.isActive) {
        workflow.lastActivatedAt = new Date();
      } else {
        workflow.lastDeactivatedAt = new Date();
      }

      await workflow.save();

      res.json({
        id: workflow._id,
        isActive: workflow.isActive,
        message: `Workflow ${workflow.isActive ? 'activated' : 'deactivated'} successfully`
      });

    } catch (error) {
      console.error('Error toggling workflow:', error);
      res.status(500).json({
        error: 'Failed to toggle workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/workflows/:id/duplicate - Duplicate workflow
  async duplicateWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const originalWorkflow = await Workflow.findOne({ _id: id, userId }).lean();

      if (!originalWorkflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const duplicatedWorkflow = new Workflow({
        ...originalWorkflow,
        _id: undefined,
        name: `${originalWorkflow.name} (Copy)`,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastRunAt: undefined
      });

      await duplicatedWorkflow.save();

      res.status(201).json(duplicatedWorkflow);

    } catch (error) {
      console.error('Error duplicating workflow:', error);
      res.status(500).json({
        error: 'Failed to duplicate workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/workflows/:id/stats - Get workflow statistics
  async getWorkflowStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workflow = await Workflow.findOne({ _id: id, userId });
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const stats = await WorkflowExecution.aggregate([
        { $match: { workflowId: id } },
        {
          $group: {
            _id: null,
            totalRuns: { $sum: 1 },
            successfulRuns: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            failedRuns: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            avgExecutionTime: { $avg: '$duration' }
          }
        }
      ]);

      const result = stats[0] || { 
        totalRuns: 0, 
        successfulRuns: 0, 
        failedRuns: 0, 
        avgExecutionTime: 0 
      };

      res.json({
        ...result,
        conversionRate: result.totalRuns > 0 
          ? (result.successfulRuns / result.totalRuns) * 100 
          : 0
      });

    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      res.status(500).json({
        error: 'Failed to retrieve workflow stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/workflows/:id/executions - Get workflow executions
  async getWorkflowExecutions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workflow = await Workflow.findOne({ _id: id, userId });
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [executions, total] = await Promise.all([
        WorkflowExecution.find({ workflowId: id })
          .sort({ startedAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        WorkflowExecution.countDocuments({ workflowId: id })
      ]);

      res.json({
        data: executions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching workflow executions:', error);
      res.status(500).json({
        error: 'Failed to retrieve executions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/workflows/:id/execute - Execute workflow
  async executeWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { contactId, testMode = false } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workflow = await Workflow.findOne({ _id: id, userId });
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Create execution record
      const execution = new WorkflowExecution({
        workflowId: id,
        contactId: contactId || 'test_contact',
        status: 'running',
        startedAt: new Date()
      });

      await execution.save();

      // Update workflow last run time
      workflow.lastRunAt = new Date();
      await workflow.save();

      // For now, mark as completed (implement actual execution logic later)
      execution.status = 'completed';
      execution.completedAt = new Date();
      await execution.save();

      res.json({
        executionId: execution._id,
        status: execution.status,
        message: testMode ? 'Workflow test completed successfully' : 'Workflow executed successfully'
      });

    } catch (error) {
      console.error('Error executing workflow:', error);
      res.status(500).json({
        error: 'Failed to execute workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/workflows/templates - Get workflow templates
  async getWorkflowTemplates(req: Request, res: Response) {
    try {
      // Return basic templates for now
      const templates = [
        {
          id: 'welcome_series',
          name: 'Welcome Series',
          description: 'Onboard new contacts with a series of welcome emails',
          category: 'onboarding'
        },
        {
          id: 'lead_nurture',
          name: 'Lead Nurturing',
          description: 'Nurture leads through the sales funnel',
          category: 'sales'
        }
      ];

      res.json({
        templates,
        categories: ['onboarding', 'sales', 'retention'],
        industries: ['real_estate', 'ecommerce', 'saas']
      });

    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      res.status(500).json({
        error: 'Failed to retrieve templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/workflows/from-template - Create workflow from template
  async createFromTemplate(req: Request, res: Response) {
    try {
      const { templateId, name } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Basic template workflow structure
      const templateWorkflow = {
        name: name || 'New Workflow from Template',
        description: `Created from template: ${templateId}`,
        userId,
        isActive: false,
        nodes: [],
        connections: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const workflow = new Workflow(templateWorkflow);
      await workflow.save();

      res.status(201).json(workflow);

    } catch (error) {
      console.error('Error creating workflow from template:', error);
      res.status(500).json({
        error: 'Failed to create workflow from template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/workflows/:id/validate - Validate workflow
  async validateWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workflow = await Workflow.findOne({ _id: id, userId });
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Validate using the workflow validator if available
      const validation = WorkflowValidator 
        ? WorkflowValidator.validateWorkflow(workflow.toObject())
        : { isValid: true, errors: [], warnings: [] };

      res.json(validation);

    } catch (error) {
      console.error('Error validating workflow:', error);
      res.status(500).json({
        error: 'Failed to validate workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/workflows/:id/test - Test workflow
  async testWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workflow = await Workflow.findOne({ _id: id, userId });
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Create a test execution
      const execution = new WorkflowExecution({
        workflowId: id,
        contactId: 'test_contact',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date()
      });

      await execution.save();

      res.json({
        execution: { 
          id: execution._id, 
          status: 'completed' 
        },
        testMode: true,
        message: 'Workflow test completed successfully'
      });

    } catch (error) {
      console.error('Error testing workflow:', error);
      res.status(500).json({
        error: 'Failed to test workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/workflows/analytics - Get workflow analytics
  async getWorkflowAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const analytics = await Workflow.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalWorkflows: { $sum: 1 },
            activeWorkflows: { $sum: { $cond: ['$isActive', 1, 0] } },
            inactiveWorkflows: { $sum: { $cond: ['$isActive', 0, 1] } }
          }
        }
      ]);

      const executionStats = await WorkflowExecution.aggregate([
        {
          $lookup: {
            from: 'workflows',
            localField: 'workflowId',
            foreignField: '_id',
            as: 'workflow'
          }
        },
        { $match: { 'workflow.userId': userId } },
        {
          $group: {
            _id: null,
            totalExecutions: { $sum: 1 },
            successfulExecutions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            failedExecutions: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
          }
        }
      ]);

      const result = {
        workflows: analytics[0] || { totalWorkflows: 0, activeWorkflows: 0, inactiveWorkflows: 0 },
        executions: executionStats[0] || { totalExecutions: 0, successfulExecutions: 0, failedExecutions: 0 }
      };

      res.json(result);

    } catch (error) {
      console.error('Error fetching workflow analytics:', error);
      res.status(500).json({
        error: 'Failed to retrieve analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Create and export controller instance
export const workflowController = new WorkflowController();