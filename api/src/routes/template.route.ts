import { Router } from 'express';
import { templatesController } from '../controllers/templates.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', templatesController.getAllTemplates);
router.post('/', templatesController.createTemplate);
router.get('/:id', templatesController.getTemplate);
router.put('/:id', templatesController.updateTemplate);
router.delete('/:id', templatesController.deleteTemplate);

export { router as templatesRoutes };