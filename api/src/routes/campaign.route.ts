// api/src/routes/campaign.route.ts
import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', campaignController.list);
router.post('/', campaignController.create);
router.get('/:id', campaignController.get);
router.put('/:id', campaignController.update);
router.delete('/:id', campaignController.delete);
router.post('/:id/send', campaignController.send);

export { router as campaignRoutes };