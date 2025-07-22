// api/src/routes/campaign.route.ts
import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';

const router = Router();

router.use(authenticate);

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Campaign CRUD routes
router.get('/', campaignController.getAllCampaigns.bind(campaignController));
router.post('/', [
  body('name').notEmpty().withMessage('Campaign name is required'),
  body('property').notEmpty().withMessage('Property is required'),
  body('emailList').notEmpty().withMessage('Email list is required'),
  body('emailTemplate').notEmpty().withMessage('Email template is required'),
  body('emailVolume').isInt({ min: 1 }).withMessage('Email volume must be positive'),
], validate, campaignController.createCampaign.bind(campaignController));

router.get('/:id', campaignController.getCampaign.bind(campaignController));
router.put('/:id', campaignController.updateCampaign.bind(campaignController));
router.delete('/:id', campaignController.deleteCampaign.bind(campaignController));

// Campaign actions
router.post('/:id/send', campaignController.sendCampaign.bind(campaignController));
router.post('/:id/pause', campaignController.pauseCampaign.bind(campaignController));
router.post('/:id/resume', campaignController.resumeCampaign.bind(campaignController));
router.post('/:id/duplicate', campaignController.duplicateCampaign.bind(campaignController));

// Campaign analytics
router.get('/:id/analytics', campaignController.getCampaignAnalytics.bind(campaignController));

// Bulk operations
router.post('/bulk-delete', campaignController.bulkDeleteCampaigns.bind(campaignController));
router.post('/bulk-send', campaignController.bulkSendCampaigns.bind(campaignController));

export { router as campaignRoutes };