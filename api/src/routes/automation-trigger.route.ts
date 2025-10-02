// api/src/routes/automation-trigger.route.ts
import { Router } from 'express';
import { automationTriggerController } from '../controllers/automation-trigger.controller';

const router = Router();

// Public endpoints for external triggers (no auth required for webhooks)
// Each trigger type has its own endpoint for clarity and validation
router.post('/propertyUpload', automationTriggerController.handlePropertyUpload);
router.post('/propertyUpdate', automationTriggerController.handlePropertyUpdate);
router.post('/propertyView', automationTriggerController.handlePropertyView);
router.post('/campaignStatusChange', automationTriggerController.handleCampaignStatusChange);
router.post('/emailTrackingEvent', automationTriggerController.handleEmailTrackingEvent);

// Health check for monitoring
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'automation-triggers',
    timestamp: new Date().toISOString() 
  });
});

export { router as automationTriggerRoutes };