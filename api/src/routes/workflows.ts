import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Import controller methods
import WorkflowController from '../controllers/WorkflowController';

// Workflow CRUD routes
router.get('/', (req, res) => WorkflowController.getWorkflows(req as any, res));
router.get('/:id', (req, res) => WorkflowController.getWorkflow(req as any, res));
router.post('/', (req, res) => WorkflowController.createWorkflow(req as any, res));
router.put('/:id', (req, res) => WorkflowController.updateWorkflow(req as any, res));
router.delete('/:id', (req, res) => WorkflowController.deleteWorkflow(req as any, res));

// Workflow actions
router.patch('/:id/toggle', (req, res) => WorkflowController.toggleWorkflow(req as any, res));
router.post('/:id/duplicate', (req, res) => WorkflowController.duplicateWorkflow(req as any, res));
router.post('/:id/execute', (req, res) => WorkflowController.executeWorkflow(req as any, res));

// Workflow analytics
router.get('/:id/stats', (req, res) => WorkflowController.getWorkflowStats(req as any, res));
router.get('/:id/executions', (req, res) => WorkflowController.getWorkflowExecutions(req as any, res));

export default router;