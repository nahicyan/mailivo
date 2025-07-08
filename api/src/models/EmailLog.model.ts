import { Schema, model, Document, Types } from 'mongoose';

export interface IEmailLog extends Document {
  user_id: Types.ObjectId;
  campaign_id?: Types.ObjectId;
  type: 'test' | 'campaign' | 'transactional';
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';
  sent_at: Date;
  opened_at?: Date;
  clicked_at?: Date;
  error_message?: string;
}

const emailLogSchema = new Schema<IEmailLog>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  campaign_id: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
  },
  type: {
    type: String,
    enum: ['test', 'campaign', 'transactional'],
    required: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'bounced', 'opened', 'clicked'],
    default: 'sent',
  },
  sent_at: {
    type: Date,
    default: Date.now,
  },
  opened_at: Date,
  clicked_at: Date,
  error_message: String,
}, { timestamps: true });

emailLogSchema.index({ user_id: 1, sent_at: -1 });
emailLogSchema.index({ campaign_id: 1, status: 1 });

export const EmailLog = model<IEmailLog>('EmailLog', emailLogSchema);