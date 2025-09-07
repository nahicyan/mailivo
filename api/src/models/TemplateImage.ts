// ============================================
// api/src/models/TemplateImage.ts
// ============================================
import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplateImage extends Document {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  userId: mongoose.Types.ObjectId;
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const templateImageSchema = new Schema<ITemplateImage>(
  {
    filename: {
      type: String,
      required: true,
      unique: true
    },
    originalName: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    templateId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
templateImageSchema.index({ userId: 1, createdAt: -1 });
templateImageSchema.index({ templateId: 1 });

const TemplateImage = mongoose.model<ITemplateImage>('TemplateImage', templateImageSchema);

export default TemplateImage;
