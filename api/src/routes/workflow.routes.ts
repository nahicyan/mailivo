// api/src/routes/workflow.routes.ts

import { Router } from 'express';
import { workflowController } from '../controllers/WorkflowController';
import { authenticate } from '../middleware/auth';
import { validateWorkflow } from '../middleware/workflow-validation';

const router = Router();
const workflowController = new WorkflowController();

// Workflow CRUD
router.get('/workflows', authenticate, workflowController.list);
router.get('/workflows/:id', authenticate, workflowController.get);
router.post('/workflows', authenticate, validateWorkflow, workflowController.create);
router.put('/workflows/:id', authenticate, validateWorkflow, workflowController.update);
router.delete('/workflows/:id', authenticate, workflowController.delete);

// Workflow execution
router.post('/workflows/:id/execute', authenticate, workflowController.execute);
router.post('/workflows/:id/test', authenticate, workflowController.test);
router.get('/workflows/:id/executions', authenticate, workflowController.getExecutions);

// Workflow templates
router.get('/workflow-templates', authenticate, workflowController.getTemplates);
router.get('/workflow-templates/:category', authenticate, workflowController.getTemplatesByCategory);

// Workflow validation
router.post('/workflows/validate', authenticate, workflowController.validate);

// Workflow statistics
router.get('/workflows/:id/stats', authenticate, workflowController.getStats);

export default router;