// api/src/models/SubjectTemplate.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISubjectTemplate extends Document {
  _id: string;
  name: string;
  content: string;
  isEnabled: boolean;
  variables: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectTemplateSchema = new Schema<ISubjectTemplate>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  variables: {
    type: [String],
    default: []
  },
  userId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
SubjectTemplateSchema.index({ userId: 1, isEnabled: 1 });
SubjectTemplateSchema.index({ userId: 1, createdAt: -1 });

export const SubjectTemplate = mongoose.model<ISubjectTemplate>('SubjectTemplate', SubjectTemplateSchema);