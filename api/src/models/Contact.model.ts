// ===== Contact Model (api/src/models/Contact.model.ts) =====
import { Schema, model, Document, Types } from 'mongoose';

export interface IContact extends Document {
  user_id: Types.ObjectId;
  email: string;
  profile: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  preferences: {
    subscribed: boolean;
    categories: string[];
    price_range?: {
      min: number;
      max: number;
    };
  };
  landivo_data?: {
    buyer_id?: string;
    lead_score?: number;
    viewing_history?: Array<{
      property_id: string;
      viewed_at: Date;
    }>;
  };
  tags: string[];
  segments: string[];
  tracking: {
    total_opens: number;
    total_clicks: number;
    last_open?: Date;
    last_click?: Date;
    engagement_score: number;
  };
}

const contactSchema = new Schema<IContact>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  profile: {
    first_name: String,
    last_name: String,
    phone: String,
    location: {
      city: String,
      state: String,
      country: String,
    },
  },
  preferences: {
    subscribed: { type: Boolean, default: true },
    categories: [String],
    price_range: {
      min: Number,
      max: Number,
    },
  },
  landivo_data: {
    buyer_id: String,
    lead_score: Number,
    viewing_history: [{
      property_id: String,
      viewed_at: Date,
    }],
  },
  tags: [String],
  segments: [String],
  tracking: {
    total_opens: { type: Number, default: 0 },
    total_clicks: { type: Number, default: 0 },
    last_open: Date,
    last_click: Date,
    engagement_score: { type: Number, default: 0 },
  },
}, { timestamps: true });

// Compound index for unique email per user
contactSchema.index({ user_id: 1, email: 1 }, { unique: true });
contactSchema.index({ user_id: 1, segments: 1 });
contactSchema.index({ user_id: 1, tags: 1 });

export const Contact = model<IContact>('Contact', contactSchema);