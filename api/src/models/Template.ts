// api/src/models/EmailTemplate.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IEmailTemplate extends Document {
  user_id: Types.ObjectId;
  name: string;
  description?: string;
  category: 'property' | 'newsletter' | 'announcement' | 'custom';
  type?: 'single' | 'multi'; // ADDED: Template type field
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

const componentSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  props: { type: Schema.Types.Mixed, default: {} },
  order: { type: Number, required: true }
}, { _id: false });

const emailTemplateSchema = new Schema<IEmailTemplate>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    minlength: [1, 'Template name cannot be empty'],
    maxlength: [100, 'Template name cannot exceed 100 characters'],
    validate: {
      validator: function(v: string) {
        return !!(v && v.trim().length > 0);
      },
      message: 'Template name cannot be empty'
    }
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['property', 'newsletter', 'announcement', 'custom'],
    default: 'custom',
  },
  // ADDED: Template type field
  type: {
    type: String,
    enum: ['single', 'multi'],
    default: 'single',
  },
  components: {
    type: [componentSchema],
    validate: {
      validator: function(components: any[]) {
        return components && components.length > 0;
      },
      message: 'Template must have at least one component'
    }
  },
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

// Compound index to enforce unique names per user
emailTemplateSchema.index({ user_id: 1, name: 1 }, { unique: true });
emailTemplateSchema.index({ user_id: 1, category: 1 });
emailTemplateSchema.index({ user_id: 1, type: 1 }); // ADDED: Index for template type

export const EmailTemplate = model<IEmailTemplate>('EmailTemplate', emailTemplateSchema);