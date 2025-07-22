// api/src/routes/email-lists.route.ts
import { Router } from 'express';
import { emailListsController } from '../controllers/email-lists.controller';
import { authenticate } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';

const router = Router();

router.use(authenticate);

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get('/', emailListsController.getAllEmailLists.bind(emailListsController));
router.post('/', [
  body('name').notEmpty().withMessage('List name is required'),
], validate, emailListsController.createEmailList.bind(emailListsController));

router.get('/:id', emailListsController.getEmailList.bind(emailListsController));
router.put('/:id', emailListsController.updateEmailList.bind(emailListsController));
router.delete('/:id', emailListsController.deleteEmailList.bind(emailListsController));
router.post('/:id/sync-buyers', emailListsController.syncBuyersFromLandivo.bind(emailListsController));

export { router as emailListsRoutes };