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
router.get('/', campaignController.getAllCampaigns);
router.post('/', [
  body('name').notEmpty().withMessage('Campaign name is required'),
  body('property').notEmpty().withMessage('Property is required'),
  body('emailList').notEmpty().withMessage('Email list is required'),
  body('emailTemplate').notEmpty().withMessage('Email template is required'),
  body('emailVolume').isInt({ min: 1 }).withMessage('Email volume must be positive'),
], validate, campaignController.createCampaign);

router.get('/:id', campaignController.getCampaign);
router.put('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

// Campaign actions
router.post('/:id/send', campaignController.sendCampaign);
router.post('/:id/pause', campaignController.pauseCampaign);
router.post('/:id/resume', campaignController.resumeCampaign);
router.post('/:id/duplicate', campaignController.duplicateCampaign);

// Campaign analytics
router.get('/:id/analytics', campaignController.getCampaignAnalytics);
router.get('/:id/metrics', campaignController.getCampaignMetrics);

// Bulk operations
router.post('/bulk-delete', campaignController.bulkDeleteCampaigns);
router.post('/bulk-send', campaignController.bulkSendCampaigns);

export { router as campaignRoutes };