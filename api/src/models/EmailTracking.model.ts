// api/src/models/EmailTracking.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IEmailTracking extends Document {
  campaignId: string;
  contactId: string;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked';
  messageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  bounceReason?: string;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
  };
  clicks: Array<{
    url: string;
    clickedAt: Date;
    ipAddress?: string;
  }>;
  opens: Array<{
    openedAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }>;
}

const emailTrackingSchema = new Schema<IEmailTracking>({
  campaignId: {
    type: String,
    required: true,
    index: true,
  },
  contactId: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'bounced', 'failed', 'opened', 'clicked'],
    default: 'queued',
    index: true,
  },
  messageId: String,
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date,
  bouncedAt: Date,
  bounceReason: String,
  error: String,
  ipAddress: String,
  userAgent: String,
  location: {
    country: String,
    city: String,
  },
  clicks: [{
    url: { type: String, required: true },
    clickedAt: { type: Date, required: true },
    ipAddress: String,
  }],
  opens: [{
    openedAt: { type: Date, required: true },
    ipAddress: String,
    userAgent: String,
  }],
}, { 
  timestamps: true,
});

// Compound indexes for analytics queries
emailTrackingSchema.index({ campaignId: 1, contactId: 1 });
emailTrackingSchema.index({ campaignId: 1, status: 1 });
emailTrackingSchema.index({ campaignId: 1, sentAt: 1 });
emailTrackingSchema.index({ contactId: 1, sentAt: -1 });

export const EmailTracking = model<IEmailTracking>('EmailTracking', emailTrackingSchema);