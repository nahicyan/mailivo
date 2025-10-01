// api/src/routes/subjectTemplateRoute.ts
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authenticateService } from '../middleware/serviceAuth.middleware'
import { subjectTemplateController } from '../controllers/SubjectTemplateController';

const router = express.Router();

// Apply authentication middleware to all routes
router.get('/public', authenticateService, subjectTemplateController.listPublic);

// Routes
router.use(authenticate);
router.get('/', subjectTemplateController.list);
router.post('/', subjectTemplateController.create);
router.get('/:id', subjectTemplateController.get);
router.put('/:id', subjectTemplateController.update);
router.delete('/:id', subjectTemplateController.delete);
router.patch('/:id/toggle', subjectTemplateController.toggle);

export default router;