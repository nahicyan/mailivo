// api/src/routes/index.ts
import { Router } from 'express';
import { authRoutes } from './auth.route';
import { campaignRoutes } from './campaign.route';
import { templateRoutes } from './template.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/templates', templateRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export { router as routes };