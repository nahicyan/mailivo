// api/src/routes/template.route.ts
import { Router } from 'express';
import { templatesController } from '../controllers/templates.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', templatesController.getAllTemplates.bind(templatesController));
router.post('/', templatesController.createTemplate.bind(templatesController));
router.get('/:id', templatesController.getTemplate.bind(templatesController));
router.put('/:id', templatesController.updateTemplate.bind(templatesController));
router.delete('/:id', templatesController.deleteTemplate.bind(templatesController));

export { router as templatesRoutes };