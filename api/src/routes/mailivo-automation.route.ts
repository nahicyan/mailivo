// api/src/routes/mailivo-automation.route.ts
import { Router } from 'express';
import { automationController } from '../controllers/mailivo-automation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Automation CRUD
router.get('/', automationController.getAllAutomations);
router.post('/', automationController.createAutomation);
router.get('/:id', automationController.getAutomation);
router.put('/:id', automationController.updateAutomation);
router.delete('/:id', automationController.deleteAutomation);

// Automation actions
router.post('/:id/toggle', automationController.toggleAutomation);
router.post('/:id/duplicate', automationController.duplicateAutomation);
router.post('/:id/test', automationController.testAutomation);

// Automation validation
router.post('/validate', automationController.validateAutomation);

// Automation execution
router.get('/:id/executions', automationController.getAutomationExecutions);
router.get('/executions/:executionId', automationController.getExecutionDetails);

// Statistics
router.get('/:id/stats', automationController.getAutomationStats);

export { router as mailivoAutomationRoutes };
