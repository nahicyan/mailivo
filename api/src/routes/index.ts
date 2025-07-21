// api/src/routes/index.ts
import { Router } from 'express';
import { authRoutes } from './auth.route';
import { campaignRoutes } from './campaign.route';
import { templatesRoutes } from './template.route';
import { landivoRoutes } from './landivo.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/templates', templatesRoutes);
router.use('/landivo', landivoRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export { router as routes };