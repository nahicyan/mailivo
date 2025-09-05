// api/src/routes/upload.ts
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

// POST /images
router.post('/images', upload.array('files'), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const uploadedImages = files.map(file => ({
      id: uuidv4(),
      url: `/uploads/images/${file.filename}`,
      name: file.originalname,
      size: file.size,
      format: path.extname(file.originalname).slice(1).toUpperCase(),
      uploadedAt: new Date().toISOString()
    }));

    res.json({
      success: true,
      images: uploadedImages,
      count: uploadedImages.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /images
router.get('/images', (_req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../../public/uploads/images');
    
    if (!fs.existsSync(uploadDir)) {
      res.json({ images: [] });
      return;
    }

    const files = fs.readdirSync(uploadDir);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          id: file,
          url: `/uploads/images/${file}`,
          name: file,
          size: stats.size,
          format: path.extname(file).slice(1).toUpperCase(),
          uploadedAt: stats.birthtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    res.json({ images });
  } catch (error) {
    console.error('Error listing images:', error);
    res.json({ images: [] });
  }
});

export default router;