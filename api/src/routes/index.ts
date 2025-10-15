// api/src/routes/index.ts
import { Router } from 'express';
import { authRoutes } from './auth.route';
import { campaignRoutes } from './campaign.route';
import { templatesRoutes } from './template.route';
import { landivoRoutes } from './LandivoProperty.route';
import { landivoEmailListsRoutes } from './LandivoEmailLists.route';
import trackingRoutes from './tracking.routes';
import subjectTemplateRoute from './subjectTemplateRoute';
import { templateImageRoutes } from './templateImage.route';
import userProfileRoute from './userProfileRoute';
import analyticsRoutes from './analytics.routes';
import mailcowRoutes from './mailcow.routes';
import { mailivoAutomationRoutes } from './mailivo-automation.route';
import { automationTriggerRoutes } from './automation-trigger.route';
import { timeBasedAutomationRoutes } from './timeBasedAutomation.route';

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);

// Campaign management routes
router.use('/campaigns', campaignRoutes);

// Template management routes
router.use('/templates', templatesRoutes);
router.use('/template-images', templateImageRoutes);
router.use("/subject-templates", subjectTemplateRoute);

// Contact and email list management
router.use('/landivo-email-lists', landivoEmailListsRoutes);

// Landivo integration
router.use('/landivo', landivoRoutes);

// Tracking and analytics
router.use('/via', trackingRoutes); // Email tracking via links

router.use('/analytics', analyticsRoutes);

// User profile
router.use('/api/user', userProfileRoute);

// Email services
router.use('/api/mailcow', mailcowRoutes);

// Automation management (dashboard)
router.use('/automation', mailivoAutomationRoutes);

// Automation triggers (webhooks/external)
router.use('/automation-landivo', automationTriggerRoutes);

// Automation For Time Based Triggers
router.use('/time-based-automations', timeBasedAutomationRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export { router as routes };