import { Router } from 'express';
import { landivoController } from '../controllers/LandivoProperty.controller';

const router = Router();

// Properties routes
router.get('/properties', landivoController.getProperties);
router.get('/properties/:id', landivoController.getProperty);
router.get('/properties/:id/buyers', landivoController.getPropertyBuyers);
router.get('/buyers', landivoController.getAllBuyers);
router.post('/sync/properties', landivoController.syncProperties);

export { router as landivoRoutes };