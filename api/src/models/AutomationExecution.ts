// api/src/models/AutomationExecution.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAutomationExecution extends Document {
  automationId: mongoose.Types.ObjectId;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  triggeredAt: Date;
  triggeredBy: {
    type: string;
    data: any;
  };
  completedAt?: Date;
  error?: string;
  result?: {
    campaignId?: string;
    recipientCount?: number;
    status?: string;
  };
  executionLog: Array<{
    step: string;
    timestamp: Date;
    status: 'success' | 'failed' | 'skipped';
    message?: string;
    data?: any;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ExecutionLogSchema = new Schema({
  step: { type: String, required: true },
  timestamp: { type: Date, required: true },
  status: {
    type: String,
    enum: ['success', 'failed', 'skipped'],
    required: true
  },
  message: { type: String },
  data: { type: Schema.Types.Mixed }
}, { _id: false });

const AutomationExecutionSchema = new Schema(
  {
    automationId: {
      type: Schema.Types.ObjectId,
      ref: 'MailivoAutomation',
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    triggeredAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    triggeredBy: {
      type: {
        type: String,
        required: true
      },
      data: {
        type: Schema.Types.Mixed
      }
    },
    completedAt: {
      type: Date
    },
    error: {
      type: String
    },
    result: {
      campaignId: { type: String },
      recipientCount: { type: Number },
      status: { type: String }
    },
    executionLog: [ExecutionLogSchema]
  },
  {
    timestamps: true
  }
);

// Indexes for querying
AutomationExecutionSchema.index({ automationId: 1, createdAt: -1 });
AutomationExecutionSchema.index({ userId: 1, status: 1 });
AutomationExecutionSchema.index({ status: 1, triggeredAt: -1 });

// TTL index to auto-delete old executions after 90 days
AutomationExecutionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7776000 } // 90 days
);

export const AutomationExecution = mongoose.model<IAutomationExecution>(
  'AutomationExecution',
  AutomationExecutionSchema
);