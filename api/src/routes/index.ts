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

const router = Router();


router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/templates', templatesRoutes);
router.use('/landivo-email-lists', landivoEmailListsRoutes);
router.use('/landivo', landivoRoutes);
router.use('/via', trackingRoutes); // More inviting route instead of /track
router.use("/subject-templates", subjectTemplateRoute);
router.use('/template-images', templateImageRoutes);
router.use('/api/user', userProfileRoute);
router.use('/analytics', analyticsRoutes);
router.use('/api/mailcow', mailcowRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export { router as routes };