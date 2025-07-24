import { Router } from 'express';
import WorkflowController from '../controllers/WorkflowController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Workflow CRUD routes
router.get('/', WorkflowController.getWorkflows);
router.get('/:id', WorkflowController.getWorkflow);
router.post('/', WorkflowController.createWorkflow);
router.put('/:id', WorkflowController.updateWorkflow);
router.delete('/:id', WorkflowController.deleteWorkflow);

// Workflow actions
router.patch('/:id/toggle', WorkflowController.toggleWorkflow);
router.post('/:id/duplicate', WorkflowController.duplicateWorkflow);
router.post('/:id/execute', WorkflowController.executeWorkflow);

// Workflow analytics
router.get('/:id/stats', WorkflowController.getWorkflowStats);
router.get('/:id/executions', WorkflowController.getWorkflowExecutions);

export default router;