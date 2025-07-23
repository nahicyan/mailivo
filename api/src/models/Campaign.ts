import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  name: string;
  property: string;
  emailList: string;
  emailTemplate: string;
  emailAddressGroup?: string;
  emailSchedule: string;
  emailVolume: number;
  source: 'landivo' | 'manual' | 'api';
  status: 'draft' | 'active' | 'paused' | 'sending' | 'sent' | 'completed';
  metrics: {
    open: number;
    sent: number;
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
  property: { type: String, required: true },
  emailList: { type: String, required: true },
  emailTemplate: { type: String, required: true },
  emailAddressGroup: { type: String },
  emailSchedule: { type: String, required: true },
  emailVolume: { type: Number, default: 0 },
    source: { 
    type: String, 
    enum: ['landivo', 'manual', 'api'],
    default: 'manual'
  },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'paused', 'sending', 'sent', 'completed'],
    default: 'draft'
  },
  metrics: {
    open: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
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