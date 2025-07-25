// Enhanced API endpoints for the workflow system with logical flow enforcement

import { Request, Response } from 'express';
import { 
  Workflow, 
  WorkflowTemplate, 
  WorkflowExecution,
  WORKFLOW_TEMPLATES 
} from '@mailivo/shared-types';
import { WorkflowValidator } from '../lib/workflow-validation';
import { WorkflowExecutionEngine } from '../lib/workflow-execution';

export class WorkflowAPI {
  private workflowService: WorkflowService;
  private executionEngine: WorkflowExecutionEngine;

  constructor(workflowService: WorkflowService, executionEngine: WorkflowExecutionEngine) {
    this.workflowService = workflowService;
    this.executionEngine = executionEngine;
  }

  // GET /api/workflows - List workflows with filtering and pagination
  async getWorkflows(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        status,
        search,
        userId
      } = req.query;

      const filters = {
        userId: userId || req.user?.id,
        ...(category && { category }),
        ...(status && { isActive: status === 'active' }),
        ...(search && {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        })
      };

      const workflows = await this.workflowService.getWorkflows(filters, {
        page: Number(page),
        limit: Number(limit),
        sort: { updatedAt: -1 }
      });

      // Add validation status and health scores
      const workflowsWithHealth = await Promise.all(
        workflows.data.map(async (workflow) => {
          const validation = WorkflowValidator.validateWorkflow(workflow);
          const health = this.getWorkflowHealthScore(workflow);
          const stats = await this.workflowService.getWorkflowStats(workflow.id);
          
          return {
            ...workflow,
            validation: {
              isValid: validation.isValid,
              errorCount: validation.errors.length,
              warningCount: validation.warnings.length
            },
            health,
            stats
          };
        })
      );

      res.json({
        workflows: workflowsWithHealth,
        pagination: workflows.pagination,
        summary: {
          total: workflows.pagination.total,
          active: workflowsWithHealth.filter(w => w.isActive).length,
          draft: workflowsWithHealth.filter(w => !w.isActive).length,
          healthy: workflowsWithHealth.filter(w => w.health.grade === 'A').length
        }
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve workflows',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/workflows/:id - Get specific workflow with full details
  async getWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const workflow = await this.workflowService.getWorkflow(id);

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Add validation and health information
      const validation = WorkflowValidator.validateWorkflow(workflow);
      const health = this.getWorkflowHealthScore(workflow);
      const stats = await this.workflowService.getWorkflowStats(id);
      const recommendations = WorkflowValidator.getRecommendations(workflow);

      res.json({
        ...workflow,
        validation,
        health,
        stats,
        recommendations
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/workflows - Create new workflow
  async createWorkflow(req: Request, res: Response) {
    try {
      const workflowData: Partial<Workflow> = {
        ...req.body,
        userId: req.user?.id,
        isActive: false, // New workflows start as drafts
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate workflow structure
      const validation = WorkflowValidator.validateWorkflow(workflowData as Workflow);
      
      // Allow saving invalid workflows as drafts, but include validation info
      const workflow = await this.workflowService.createWorkflow(workflowData);
      
      res.status(201).json({
        ...workflow,
        validation: {
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings
        }
      });

    } catch (error) {
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
      const updates = {
        ...req.body,
        updatedAt: new Date()
      };

      const workflow = await this.workflowService.updateWorkflow(id, updates);
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Validate updated workflow
      const validation = WorkflowValidator.validateWorkflow(workflow);
      
      // If workflow is active and becomes invalid, deactivate it
      if (workflow.isActive && !validation.isValid) {
        const criticalErrors = validation.errors.filter(e => e.type === 'critical');
        if (criticalErrors.length > 0) {
          workflow.isActive = false;
          await this.workflowService.updateWorkflow(id, { isActive: false });
        }
      }

      res.json({
        ...workflow,
        validation: {
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings
        }
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to update workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PATCH /api/workflows/:id/toggle - Toggle workflow active status
  async toggleWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const workflow = await this.workflowService.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // If activating, validate first
      if (isActive) {
        const validation = WorkflowValidator.validateWorkflow(workflow);
        if (!validation.isValid) {
          return res.status(400).json({
            error: 'Cannot activate invalid workflow',
            validation: {
              errors: validation.errors,
              warnings: validation.warnings
            }
          });
        }
      }

      const updatedWorkflow = await this.workflowService.updateWorkflow(id, {
        isActive,
        updatedAt: new Date(),
        ...(isActive && { lastActivatedAt: new Date() }),
        ...(!isActive && { lastDeactivatedAt: new Date() })
      });

      res.json(updatedWorkflow);

    } catch (error) {
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
      const original = await this.workflowService.getWorkflow(id);

      if (!original) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Create duplicate with new IDs
      const duplicate = {
        ...original,
        id: undefined,
        name: `${original.name} (Copy)`,
        isActive: false,
        userId: req.user?.id,
        nodes: original.nodes.map(node => ({
          ...node,
          id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })),
        connections: original.connections.map(conn => ({
          ...conn,
          id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update connection references to new node IDs
      const nodeIdMap = new Map();
      original.nodes.forEach((originalNode, index) => {
        nodeIdMap.set(originalNode.id, duplicate.nodes[index].id);
      });

      duplicate.connections = duplicate.connections.map(conn => ({
        ...conn,
        from: nodeIdMap.get(conn.from) || conn.from,
        to: nodeIdMap.get(conn.to) || conn.to
      }));

      const newWorkflow = await this.workflowService.createWorkflow(duplicate);
      res.status(201).json(newWorkflow);

    } catch (error) {
      res.status(500).json({
        error: 'Failed to duplicate workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // DELETE /api/workflows/:id - Delete workflow
  async deleteWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Check if workflow has active executions
      const activeExecutions = await this.workflowService.getActiveExecutions(id);
      if (activeExecutions.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete workflow with active executions',
          activeExecutions: activeExecutions.length
        });
      }

      await this.workflowService.deleteWorkflow(id);
      res.status(204).send();

    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/workflows/:id/validate - Validate workflow
  async validateWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const workflow = await this.workflowService.getWorkflow(id);

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const validation = WorkflowValidator.validateWorkflow(workflow);
      const health = this.getWorkflowHealthScore(workflow);
      const recommendations = WorkflowValidator.getRecommendations(workflow);

      res.json({
        validation,
        health,
        recommendations,
        canActivate: validation.isValid
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to validate workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/workflows/:id/test - Test workflow execution
  async testWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { contactId, triggerData } = req.body;

      const workflow = await this.workflowService.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Validate before testing
      const validation = WorkflowValidator.validateWorkflow(workflow);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Cannot test invalid workflow',
          validation
        });
      }

      // Execute workflow in test mode
      const execution = await this.executionEngine.executeWorkflow(
        workflow,
        contactId,
        { ...triggerData, testMode: true }
      );

      res.json({
        execution,
        testMode: true,
        message: 'Workflow test completed successfully'
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to test workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/workflows/:id/execute - Execute workflow for specific contacts
  async executeWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { contactIds, triggerData } = req.body;

      const workflow = await this.workflowService.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      if (!workflow.isActive) {
        return res.status(400).json({ error: 'Workflow is not active' });
      }

      // Execute for each contact
      const executions = await Promise.all(
        contactIds.map((contactId: string) =>
          this.executionEngine.executeWorkflow(workflow, contactId, triggerData)
        )
      );

      res.json({
        executions,
        totalContacts: contactIds.length,
        successfulExecutions: executions.filter(e => e.status === 'completed').length,
        failedExecutions: executions.filter(e => e.status === 'failed').length
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to execute workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/workflows/:id/executions - Get workflow execution history
  async getWorkflowExecutions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        page = 1,
        limit = 20,
        status,
        contactId,
        dateFrom,
        dateTo
      } = req.query;

      const filters = {
        workflowId: id,
        ...(status && { status }),
        ...(contactId && { contactId }),
        ...(dateFrom && dateTo && {
          startedAt: {
            $gte: new Date(dateFrom as string),
            $lte: new Date(dateTo as string)
          }
        })
      };

      const executions = await this.workflowService.getExecutions(filters, {
        page: Number(page),
        limit: Number(limit),
        sort: { startedAt: -1 }
      });

      res.json(executions);

    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve executions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/workflows/:id/stats - Get workflow statistics
  async getWorkflowStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { period = '30d' } = req.query;

      const stats = await this.workflowService.getWorkflowStats(id, period as string);
      
      res.json(stats);

    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve workflow stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/workflow-templates - Get available workflow templates
  async getWorkflowTemplates(req: Request, res: Response) {
    try {
      const { category, industry } = req.query;

      let templates = WORKFLOW_TEMPLATES;

      if (category) {
        templates = templates.filter(t => t.category === category);
      }

      if (industry) {
        templates = templates.filter(t => t.industry === industry || t.industry === 'general');
      }

      res.json({
        templates,
        categories: [...new Set(WORKFLOW_TEMPLATES.map(t => t.category))],
        industries: [...new Set(WORKFLOW_TEMPLATES.map(t => t.industry).filter(Boolean))]
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/workflows/from-template - Create workflow from template
  async createFromTemplate(req: Request, res: Response) {
    try {
      const { templateId, name, description } = req.body;

      const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Convert template to workflow
      const nodes = template.nodes.map((nodeTemplate, index) => ({
        id: `node_${Date.now()}_${index}`,
        ...nodeTemplate,
        position: { 
          x: 100 + index * 300, 
          y: 100 + (index % 3) * 150 
        },
        connections: [],
        createdAt: new Date()
      }));

      // Create basic connections
      const connections = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        connections.push({
          id: `conn_${Date.now()}_${i}`,
          from: nodes[i].id,
          to: nodes[i + 1].id,
          condition: 'default'
        });
      }

      const workflow = await this.workflowService.createWorkflow({
        name: name || template.name,
        description: description || template.description,
        category: template.category,
        template: templateId,
        userId: req.user?.id,
        isActive: false,
        nodes,
        connections,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json({
        ...workflow,
        template: {
          id: template.id,
          name: template.name,
          expectedResults: template.expectedResults
        }
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to create workflow from template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/workflows/analytics - Get workflow analytics overview
  async getWorkflowAnalytics(req: Request, res: Response) {
    try {
      const { period = '30d', userId } = req.query;

      const analytics = await this.workflowService.getAnalytics(userId || req.user?.id, period as string);

      res.json(analytics);

    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private getWorkflowHealthScore(workflow: Workflow) {
    // This would use the same logic as in the validation system
    // Simplified version here
    const validation = WorkflowValidator.validateWorkflow(workflow);
    let score = 100;
    
    score -= validation.errors.filter(e => e.type === 'critical').length * 30;
    score -= validation.errors.filter(e => e.type === 'error').length * 15;
    score -= validation.warnings.length * 5;

    score = Math.max(0, Math.min(100, score));

    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return { score, grade };
  }
}

// Service interface (would be implemented separately)
interface WorkflowService {
  getWorkflows(filters: any, options: any): Promise<{ data: Workflow[]; pagination: any }>;
  getWorkflow(id: string): Promise<Workflow | null>;
  createWorkflow(workflow: Partial<Workflow>): Promise<Workflow>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null>;
  deleteWorkflow(id: string): Promise<void>;
  getWorkflowStats(id: string, period?: string): Promise<any>;
  getActiveExecutions(workflowId: string): Promise<WorkflowExecution[]>;
  getExecutions(filters: any, options: any): Promise<{ data: WorkflowExecution[]; pagination: any }>;
  getAnalytics(userId: string, period: string): Promise<any>;
}
export default WorkflowAPI;