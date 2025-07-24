// ===== Campaign Model (api/src/models/Campaign.model.ts) =====
import { Schema, model, Document, Types } from 'mongoose';

export interface ICampaign extends Document {
  user_id: Types.ObjectId;
  name: string;
  type: 'broadcast' | 'automated' | 'ab_test';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  source?: 'landivo' | 'manual' | 'api';
  subject: string;
  preview_text?: string;
  from_name: string;
  from_email: string;
  reply_to?: string;
  content: {
    html: string;
    text?: string;
    template_id?: string;
  };
  targeting: {
    segments: string[];
    tags?: string[];
    conditions?: any[];
    total_recipients?: number;
  };
  schedule?: {
    send_at?: Date;
    timezone?: string;
  };
  landivo_trigger?: {
    type: 'new_properties' | 'price_drops' | 'open_houses';
    conditions: any;
  };
  ab_test?: {
    enabled: boolean;
    variants: Array<{
      name: string;
      subject: string;
      content: string;
      percentage: number;
    }>;
    winner?: string;
  };
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    unsubscribed: number;
  };
}

const campaignSchema = new Schema<ICampaign>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['broadcast', 'automated', 'ab_test'],
    default: 'broadcast',
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused'],
    default: 'draft',
  },
  source: {
    type: String,
    enum: ['landivo', 'manual', 'api'],
    default: 'manual',
  },
  subject: {
    type: String,
    required: true,
  },
  preview_text: String,
  from_name: {
    type: String,
    required: true,
  },
  from_email: {
    type: String,
    required: true,
  },
  reply_to: String,
  content: {
    html: { type: String, required: true },
    text: String,
    template_id: String,
  },
  targeting: {
    segments: [String],
    tags: [String],
    conditions: [Schema.Types.Mixed],
    total_recipients: Number,
  },
  schedule: {
    send_at: Date,
    timezone: String,
  },
  landivo_trigger: {
    type: {
      type: String,
      enum: ['new_properties', 'price_drops', 'open_houses'],
    },
    conditions: Schema.Types.Mixed,
  },
  ab_test: {
    enabled: { type: Boolean, default: false },
    variants: [{
      name: String,
      subject: String,
      content: String,
      percentage: Number,
    }],
    winner: String,
  },
  metrics: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    complained: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
  },
}, { timestamps: true });

campaignSchema.index({ user_id: 1, status: 1 });
campaignSchema.index({ user_id: 1, created_at: -1 });

export const Campaign = model<ICampaign>('Campaign', campaignSchema);