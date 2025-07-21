import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailList extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  buyerCriteria?: {
    qualified?: boolean;
    minIncome?: number;
    creditScore?: number;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
  };
  buyers: Array<{
    landivoBuyerId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    qualified: boolean;
    preferences: {
      subscribed: boolean;
      priceRange: {
        min: number;
        max: number;
      };
    };
  }>;
  totalContacts: number;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailListSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  buyerCriteria: {
    qualified: { type: Boolean },
    minIncome: { type: Number },
    creditScore: { type: Number },
    location: { type: String },
    minPrice: { type: Number },
    maxPrice: { type: Number }
  },
  buyers: [{
    landivoBuyerId: { type: String, required: true },
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    qualified: { type: Boolean, default: false },
    preferences: {
      subscribed: { type: Boolean, default: true },
      priceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 999999999 }
      }
    }
  }],
  totalContacts: { type: Number, default: 0 },
  lastSyncAt: { type: Date }
}, {
  timestamps: true
});

EmailListSchema.index({ userId: 1, name: 1 });

export const EmailList = mongoose.model<IEmailList>('EmailList', EmailListSchema);