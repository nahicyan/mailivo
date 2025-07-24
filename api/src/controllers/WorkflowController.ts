import { Request, Response } from 'express';
import Workflow from '../models/Workflow';
import WorkflowExecution from '../models/WorkflowExecution';

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

class WorkflowController {
  // Get all workflows for user
  async getWorkflows(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const userId = req.user.id;

      const filter: any = { userId };
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status && status !== 'all') {
        filter.isActive = status === 'active';
      }

      const workflows = await Workflow.find(filter)
        .sort({ updatedAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate('stats');

      const total = await Workflow.countDocuments(filter);

      res.json({
        workflows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get single workflow
  async getWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const workflow = await Workflow.findOne({ _id: id, userId })
        .populate('stats');

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create workflow
  async createWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const workflowData = {
        ...req.body,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const workflow = new Workflow(workflowData);
      await workflow.save();

      res.status(201).json(workflow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update workflow
  async updateWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const workflow = await Workflow.findOneAndUpdate(
        { _id: id, userId },
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      res.json(workflow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete workflow
  async deleteWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const workflow = await Workflow.findOneAndDelete({ _id: id, userId });

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      // Also delete associated executions
      await WorkflowExecution.deleteMany({ workflowId: id });

      res.json({ message: 'Workflow deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Toggle workflow active status
  async toggleWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const userId = req.user.id;

      const workflow = await Workflow.findOneAndUpdate(
        { _id: id, userId },
        { isActive, updatedAt: new Date() },
        { new: true }
      );

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Duplicate workflow
  async duplicateWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const originalWorkflow = await Workflow.findOne({ _id: id, userId });

      if (!originalWorkflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      const duplicatedWorkflow = new Workflow({
        ...originalWorkflow.toObject(),
        _id: undefined,
        name: `${originalWorkflow.name} (Copy)`,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await duplicatedWorkflow.save();

      res.status(201).json(duplicatedWorkflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get workflow statistics
  async getWorkflowStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const workflow = await Workflow.findOne({ _id: id, userId });

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      const executions = await WorkflowExecution.find({ workflowId: id });
      
      const stats = {
        totalRuns: executions.length,
        successfulRuns: executions.filter(e => e.status === 'completed').length,
        failedRuns: executions.filter(e => e.status === 'failed').length,
        avgExecutionTime: executions.reduce((acc, e) => {
          if (e.completedAt && e.startedAt) {
            return acc + (e.completedAt.getTime() - e.startedAt.getTime());
          }
          return acc;
        }, 0) / executions.length || 0,
        conversionRate: 0 // Calculate based on your conversion logic
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get workflow executions
  async getWorkflowExecutions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const userId = req.user.id;

      // Verify workflow belongs to user
      const workflow = await Workflow.findOne({ _id: id, userId });
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      const executions = await WorkflowExecution.find({ workflowId: id })
        .sort({ startedAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate('contactId', 'email firstName lastName');

      const total = await WorkflowExecution.countDocuments({ workflowId: id });

      res.json({
        executions,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Execute workflow manually (for testing)
  async executeWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { contactIds } = req.body;
      const userId = req.user.id;

      const workflow = await Workflow.findOne({ _id: id, userId });

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      if (!workflow.isActive) {
        res.status(400).json({ error: 'Workflow is not active' });
        return;
      }

      // Queue workflow executions
      const executions = contactIds.map((contactId: string) => ({
        workflowId: id,
        contactId,
        status: 'running',
        currentNodeId: workflow.nodes[0]?.id,
        startedAt: new Date(),
        results: {}
      }));

      await WorkflowExecution.insertMany(executions);

      // Here you would trigger your workflow execution engine
      // For now, just return success
      res.json({ 
        message: 'Workflow execution started',
        executionCount: executions.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new WorkflowController();