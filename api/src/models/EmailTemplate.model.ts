// api/src/models/EmailTemplate.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IEmailTemplate extends Document {
  user_id: Types.ObjectId;
  name: string;
  description?: string;
  category: 'property' | 'newsletter' | 'announcement' | 'custom';
  components: Array<{
    id: string;
    type: string;
    name: string;
    icon: string;
    props: Record<string, any>;
    order: number;
  }>;
  settings: {
    backgroundColor?: string;
    primaryColor?: string;
    fontFamily?: string;
  };
  isDefault: boolean;
}

const emailTemplateSchema = new Schema<IEmailTemplate>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: String,
    enum: ['property', 'newsletter', 'announcement', 'custom'],
    default: 'custom',
  },
  components: [{
    id: String,
    type: String,
    name: String,
    icon: String,
    props: Schema.Types.Mixed,
    order: Number,
  }],
  settings: {
    backgroundColor: String,
    primaryColor: String,
    fontFamily: String,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

emailTemplateSchema.index({ user_id: 1, category: 1 });

export const EmailTemplate = model<IEmailTemplate>('EmailTemplate', emailTemplateSchema);