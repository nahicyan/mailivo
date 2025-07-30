// api/src/models/Campaign.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  
  // Legacy fields (backward compatibility)
  property: string;
  emailList: string;
  emailTemplate: string;
  emailAddressGroup?: string;
  emailSchedule: string;
  emailVolume: number;
  
  // New fields for enhanced functionality
  audienceType?: 'all' | 'segment' | 'landivo';
  segments?: string[];
  estimatedRecipients?: number;
  spamScore?: number;
  sentAt?: Date;
  
  source: 'landivo' | 'manual' | 'api';
  status: 'draft' | 'active' | 'paused' | 'sending' | 'sent' | 'completed' | 'failed';
  
  metrics: {
    // New metric names
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    totalRecipients: number;
    
    // Legacy metric names (backward compatibility)
    open: number;
    bounces: number;
    successfulDeliveries: number;
    clicks: number;
    didNotOpen: number;
    mobileOpen: number;
  };
  
  description?: string;
  scheduledDate?: Date;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema = new Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  htmlContent: { type: String, required: true },
  textContent: { type: String },
  
  // Legacy fields
  property: { type: String, required: true },
  emailList: { type: String, required: true },
  emailTemplate: { type: String, required: true },
  emailAddressGroup: { type: String },
  emailSchedule: { type: String, required: true },
  emailVolume: { type: Number, default: 0 },
  
  // New fields
  audienceType: { 
    type: String, 
    enum: ['all', 'segment', 'landivo'],
    default: 'all'
  },
  segments: [{ type: String }],
  estimatedRecipients: { type: Number, default: 0 },
  spamScore: { type: Number, min: 0, max: 10 },
  sentAt: { type: Date },
  
  source: { 
    type: String, 
    enum: ['landivo', 'manual', 'api'],
    default: 'manual'
  },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'paused', 'sending', 'sent', 'completed', 'failed'],
    default: 'draft'
  },
  
  metrics: {
    // New metrics
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    complained: { type: Number, default: 0 },
    totalRecipients: { type: Number, default: 0 },
    
    // Legacy metrics
    open: { type: Number, default: 0 },
    bounces: { type: Number, default: 0 },
    successfulDeliveries: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    didNotOpen: { type: Number, default: 0 },
    mobileOpen: { type: Number, default: 0 }
  },
  
  description: { type: String },
  scheduledDate: { type: Date },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

CampaignSchema.index({ userId: 1, status: 1 });
CampaignSchema.index({ userId: 1, createdAt: -1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);