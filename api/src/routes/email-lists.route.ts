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

router.get('/', emailListsController.getAllEmailLists);
router.post('/', [
  body('name').notEmpty().withMessage('List name is required'),
], validate, emailListsController.createEmailList);

router.get('/:id', emailListsController.getEmailList);
router.put('/:id', emailListsController.updateEmailList);
router.delete('/:id', emailListsController.deleteEmailList);
router.post('/:id/sync-buyers', emailListsController.syncBuyersFromLandivo);

export { router as emailListsRoutes };