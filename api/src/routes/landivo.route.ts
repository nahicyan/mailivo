import { Router } from 'express';
import { landivoController } from '../controllers/landivo.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Properties routes
router.get('/properties', landivoController.getProperties);
router.get('/properties/:id', landivoController.getProperty);
router.get('/properties/:id/buyers', landivoController.getPropertyBuyers);

// Buyers routes
router.get('/buyers', landivoController.getAllBuyers);

// Sync route
router.post('/sync/properties', landivoController.syncProperties);

export { router as landivoRoutes };