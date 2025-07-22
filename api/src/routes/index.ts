// api/src/routes/index.ts - Add the new route
import { Router } from 'express';
import { authRoutes } from './auth.route';
import { campaignRoutes } from './campaign.route';
import { templatesRoutes } from './template.route';
import { landivoRoutes } from './landivo.route';
import { landivoEmailListsRoutes } from './landivo-email-lists.route';  // New import

const router = Router();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/templates', templatesRoutes);
router.use('/landivo-email-lists', landivoEmailListsRoutes);  // New route
router.use('/landivo', landivoRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export { router as routes };