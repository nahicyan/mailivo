// api/src/controllers/TemplateImageController.ts
import { Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import TemplateImage from "../models/TemplateImage";
import { AuthRequest } from "../middleware/auth.middleware";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "template-images");
    // Ensure directory exists when needed
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

class TemplateImageController {
  // Upload single image
  async uploadImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      const userId = req.user?._id;
      const { templateId } = req.body;

      // Optimize image using sharp
      const optimizedFileName = `optimized-${req.file.filename}`;
      const optimizedPath = path.join(
        path.dirname(req.file.path),
        optimizedFileName
      );

      await sharp(req.file.path)
        .resize(1200, null, {
          withoutEnlargement: true,
          fit: "inside",
        })
        .jpeg({ quality: 85 })
        .toFile(optimizedPath);

      // Delete original file
      await fs.unlink(req.file.path);

      // Construct URL using environment variable
      const baseUrl =
        process.env.API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "https://api.mailivo.landivo.com";
      const imageUrl = `${baseUrl}/uploads/template-images/${optimizedFileName}`;

      // Save to database with correct URL
      const templateImage = new TemplateImage({
        filename: optimizedFileName,
        originalName: req.file.originalname,
        url: imageUrl,
        size: (await fs.stat(optimizedPath)).size,
        mimeType: req.file.mimetype,
        userId,
        templateId: templateId || null,
      });

      await templateImage.save();

      res.status(201).json({
        success: true,
        imageUrl: templateImage.url,
        image: {
          _id: templateImage._id,
          url: templateImage.url,
          filename: templateImage.filename,
          uploadedAt: templateImage.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }

  // Upload multiple images
  async uploadMultipleImages(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        res.status(400).json({ error: "No image files provided" });
        return;
      }

      const userId = req.user?._id;
      const { templateId } = req.body;
      const uploadedImages = [];

      for (const file of req.files) {
        // Optimize each image
        const optimizedFileName = `optimized-${file.filename}`;
        const optimizedPath = path.join(
          path.dirname(file.path),
          optimizedFileName
        );

        await sharp(file.path)
          .resize(1200, null, {
            withoutEnlargement: true,
            fit: "inside",
          })
          .jpeg({ quality: 85 })
          .toFile(optimizedPath);

        // Delete original
        await fs.unlink(file.path);

        // Construct URL
          const baseUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';
          const imageUrl = `${baseUrl}/uploads/template-images/${optimizedFileName}`;

        // Save to database
        const templateImage = new TemplateImage({
          filename: optimizedFileName,
          originalName: file.originalname,
          url: imageUrl,
          size: (await fs.stat(optimizedPath)).size,
          mimeType: file.mimetype,
          userId,
          templateId: templateId || null,
        });

        await templateImage.save();
        uploadedImages.push({
          _id: templateImage._id,
          url: templateImage.url,
          filename: templateImage.filename,
          uploadedAt: templateImage.createdAt,
        });
      }

      res.status(201).json({
        success: true,
        images: uploadedImages,
      });
    } catch (error: any) {
      console.error("Multiple image upload error:", error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  }

  // Get all images for gallery
  async getAllImages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const { templateId, limit = 50, page = 1 } = req.query;

      const query: any = { userId };
      if (templateId) {
        query.templateId = templateId;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const images = await TemplateImage.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip)
        .select("_id url filename createdAt templateId");

      const total = await TemplateImage.countDocuments(query);

      res.json({
        success: true,
        images,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error("Get images error:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  }

  // Get single image by ID
  async getImageById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const image = await TemplateImage.findOne({ _id: id, userId });

      if (!image) {
        res.status(404).json({ error: "Image not found" });
        return;
      }

      res.json({
        success: true,
        image: {
          _id: image._id,
          url: image.url,
          filename: image.filename,
          originalName: image.originalName,
          size: image.size,
          mimeType: image.mimeType,
          uploadedAt: image.createdAt,
          templateId: image.templateId,
        },
      });
    } catch (error: any) {
      console.error("Get image error:", error);
      res.status(500).json({ error: "Failed to fetch image" });
    }
  }

  // Delete image
  async deleteImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const image = await TemplateImage.findOne({ _id: id, userId });

      if (!image) {
        res.status(404).json({ error: "Image not found" });
        return;
      }

      // Delete file from disk
      const filePath = path.join(
        process.cwd(),
        "uploads",
        "template-images",
        image.filename
      );
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error("Failed to delete file:", err);
      }

      // Delete from database
      await image.deleteOne();

      res.json({
        success: true,
        message: "Image deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete image error:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  }
}

export const templateImageController = new TemplateImageController();
export { upload };
