// ============================================
// api/src/routes/templateImage.route.ts
// ============================================
import { Router } from 'express';
import { templateImageController, upload } from '../controllers/TemplateImageController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Upload routes
router.post(
  '/upload',
  upload.single('image'),
  templateImageController.uploadImage.bind(templateImageController)
);

router.post(
  '/upload-multiple',
  upload.array('images', 10),
  templateImageController.uploadMultipleImages.bind(templateImageController)
);

// Gallery routes
router.get('/', templateImageController.getAllImages.bind(templateImageController));
router.get('/:id', templateImageController.getImageById.bind(templateImageController));
router.delete('/:id', templateImageController.deleteImage.bind(templateImageController));

export { router as templateImageRoutes };