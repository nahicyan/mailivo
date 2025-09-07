// api/src/routes/index.ts
import { Router } from 'express';
import { authRoutes } from './auth.route';
import { campaignRoutes } from './campaign.route';
import { templatesRoutes } from './template.route';
import { landivoRoutes } from './LandivoProperty.route';
import { landivoEmailListsRoutes } from './LandivoEmailLists.route';
import workflowRoutes from './workflows';
import trackingRoutes from './tracking.routes';
import subjectTemplateRoute from './subjectTemplateRoute';
import { templateImageRoutes } from './templateImage.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/templates', templatesRoutes);
router.use('/landivo-email-lists', landivoEmailListsRoutes);
router.use('/landivo', landivoRoutes);
router.use('/workflows', workflowRoutes);
router.use('/api/track', trackingRoutes);
router.use("/api/subject-templates", subjectTemplateRoute);
router.use('/api/template-images', templateImageRoutes);
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

router.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export { router as routes };