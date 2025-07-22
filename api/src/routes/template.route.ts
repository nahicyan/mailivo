// api/src/routes/template.route.ts
import { Router } from 'express';
import { templateController } from '../controllers/template.controller'; // Use templateController instead
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', templateController.list.bind(templateController));
router.post('/', templateController.create.bind(templateController));
router.get('/:id', templateController.get.bind(templateController));
router.put('/:id', templateController.update.bind(templateController));
router.delete('/:id', templateController.delete.bind(templateController));

export { router as templatesRoutes };