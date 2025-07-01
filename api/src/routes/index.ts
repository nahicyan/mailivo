// api/src/routes/index.ts
import { Router } from 'express';
import { authRoutes } from './auth.route';

const router = Router();

router.use('/auth', authRoutes);

export { router as routes };