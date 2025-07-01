// api/src/routes/auth.routes.ts
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Routes
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('companyName').notEmpty(),
    body('companyDomain').notEmpty(),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  authController.login
);

router.post('/logout', authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

export { router as authRoutes };

// api/src/routes/index.ts
import { Router } from 'express';
import { authRoutes } from './auth.routes';

const router = Router();

router.use('/auth', authRoutes);

// Add other routes here as we create them
// router.use('/campaigns', campaignRoutes);
// router.use('/contacts', contactRoutes);
// router.use('/email', emailRoutes);

export { router as apiRoutes };