// api/src/routes/landivo-email-lists.route.ts
import { Router } from 'express';
import { landivoEmailListsController } from '../controllers/LandivoEmailLists.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Get all email lists from Landivo
router.get('/', landivoEmailListsController.getAllEmailLists.bind(landivoEmailListsController));

// Get specific email list with all buyers
router.get('/:id', landivoEmailListsController.getEmailListById.bind(landivoEmailListsController));

// Get email lists statistics
router.get('/stats', landivoEmailListsController.getEmailListStats.bind(landivoEmailListsController));

export { router as landivoEmailListsRoutes };