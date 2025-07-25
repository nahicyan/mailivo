import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { WorkflowAPI } from '../controllers/WorkflowController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create mock services for now (replace with actual implementations)
const mockWorkflowService = {
  async getWorkflows(filters: any, options: any) {
    return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  },
  async getWorkflow(id: string) {
    return null;
  },
  async createWorkflow(workflow: any) {
    return workflow;
  },
  async updateWorkflow(id: string, updates: any) {
    return null;
  },
  async deleteWorkflow(id: string) {
    return;
  },
  async getWorkflowStats(id: string) {
    return { totalRuns: 0, successfulRuns: 0, failedRuns: 0, avgExecutionTime: 0, conversionRate: 0 };
  },
  async getActiveExecutions(workflowId: string) {
    return [];
  },
  async getExecutions(filters: any, options: any) {
    return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  },
  async getAnalytics(userId: string, period: string) {
    return {};
  }
};

const mockExecutionEngine = {
  async executeWorkflow(workflow: any, contactId: string, triggerData?: any) {
    return { id: 'mock', status: 'completed', executionPath: [] };
  }
};

// Create WorkflowAPI instance
const workflowController = new WorkflowAPI(mockWorkflowService, mockExecutionEngine);

// Workflow CRUD routes
router.get('/', (req, res) => workflowController.getWorkflows(req, res));
router.get('/:id', (req, res) => workflowController.getWorkflow(req, res));
router.post('/', (req, res) => workflowController.createWorkflow(req, res));
router.put('/:id', (req, res) => workflowController.updateWorkflow(req, res));
router.delete('/:id', (req, res) => workflowController.deleteWorkflow(req, res));

// Workflow actions
router.patch('/:id/toggle', (req, res) => workflowController.toggleWorkflow(req, res));
router.post('/:id/duplicate', (req, res) => workflowController.duplicateWorkflow(req, res));
router.post('/:id/execute', (req, res) => workflowController.executeWorkflow(req, res));

// Workflow analytics
router.get('/:id/stats', (req, res) => workflowController.getWorkflowStats(req, res));
router.get('/:id/executions', (req, res) => workflowController.getWorkflowExecutions(req, res));

// Template routes
router.get('/templates', (req, res) => workflowController.getWorkflowTemplates(req, res));
router.post('/from-template', (req, res) => workflowController.createFromTemplate(req, res));

// Analytics
router.get('/analytics', (req, res) => workflowController.getWorkflowAnalytics(req, res));

// Validation
router.post('/:id/validate', (req, res) => workflowController.validateWorkflow(req, res));
router.post('/:id/test', (req, res) => workflowController.testWorkflow(req, res));

export default router;