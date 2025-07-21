import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  content: string;
  type: 'system' | 'custom';
  description?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema = new Schema({
  name: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['system', 'custom'], default: 'custom' },
  description: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

TemplateSchema.index({ userId: 1, type: 1 });

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);