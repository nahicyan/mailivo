// api/src/routes/workflows.ts - Ensure proper route ordering
import { Router } from 'express';
import { workflowController } from '../controllers/WorkflowController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// IMPORTANT: Template routes MUST come before /:id routes to avoid conflicts
router.get('/templates', workflowController.getWorkflowTemplates.bind(workflowController));
router.post('/from-template', workflowController.createFromTemplate.bind(workflowController));

// Analytics route (before /:id)
router.get('/analytics', workflowController.getWorkflowAnalytics.bind(workflowController));

// Main CRUD routes
router.get('/', workflowController.getWorkflows.bind(workflowController));
router.post('/', workflowController.createWorkflow.bind(workflowController));

// Routes with :id parameter (MUST come after static routes)
router.get('/:id', workflowController.getWorkflow.bind(workflowController));
router.put('/:id', workflowController.updateWorkflow.bind(workflowController));
router.delete('/:id', workflowController.deleteWorkflow.bind(workflowController));

// Workflow actions
router.patch('/:id/toggle', workflowController.toggleWorkflow.bind(workflowController));
router.post('/:id/duplicate', workflowController.duplicateWorkflow.bind(workflowController));
router.post('/:id/execute', workflowController.executeWorkflow.bind(workflowController));

// Workflow analytics and stats
router.get('/:id/stats', workflowController.getWorkflowStats.bind(workflowController));
router.get('/:id/executions', workflowController.getWorkflowExecutions.bind(workflowController));

// Validation and testing
router.post('/:id/validate', workflowController.validateWorkflow.bind(workflowController));
router.post('/:id/test', workflowController.testWorkflow.bind(workflowController));

export default router;