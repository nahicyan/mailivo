// api/src/routes/mailivo-automation.route.ts
import { Router } from 'express';
import { automationController } from '../controllers/mailivo-automation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware
router.use(authenticate as any);

// Automation CRUD
router.get('/', (req, res) => automationController.getAllAutomations(req, res));
router.post('/', (req, res) => automationController.createAutomation(req, res));
router.get('/:id', (req, res) => automationController.getAutomation(req, res));
router.put('/:id', (req, res) => automationController.updateAutomation(req, res));
router.delete('/:id', (req, res) => automationController.deleteAutomation(req, res));

// Automation actions
router.post('/:id/toggle', (req, res) => automationController.toggleAutomation(req, res));
router.post('/:id/duplicate', (req, res) => automationController.duplicateAutomation(req, res));
router.post('/:id/test', (req, res) => automationController.testAutomation(req, res));

// Automation validation
router.post('/validate', (req, res) => automationController.validateAutomation(req, res));

// Automation execution
router.get('/:id/executions', (req, res) => automationController.getAutomationExecutions(req, res));
router.get('/executions/:executionId', (req, res) => automationController.getExecutionDetails(req, res));

// Statistics
router.get('/:id/stats', (req, res) => automationController.getAutomationStats(req, res));

export { router as mailivoAutomationRoutes };