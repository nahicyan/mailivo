import { Router } from 'express';
import { propertiesController } from '../controllers/properties.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', propertiesController.getAllProperties);
router.get('/:id', propertiesController.getProperty);
router.post('/sync', propertiesController.syncFromLandivo);

export { router as propertiesRoutes };