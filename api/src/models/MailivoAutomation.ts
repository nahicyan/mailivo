// api/src/models/MailivoAutomation.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITriggerConfig {
  type: string;
  config: Record<string, any>;
}

export interface ICondition {
  category: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    secondValue?: any;
    linkText?: string;
  }>;
  matchAll?: boolean;
}

export interface IActionConfig {
  type: string;
  config: {
    campaignType: "single_property" | "multi_property";
    propertySelection: {
      source: "trigger" | "condition" | "manual";
      propertyIds?: string[];
    };
    emailList: string;
    emailTemplate: string;
    selectedAgent?: string;
    schedule: "immediate" | "scheduled" | "time_delay";
    scheduledDate?: Date;
    delay?: {
      amount: number;
      unit: string;
    };
    name: string;
    subject: string;
    description?: string;
    multiPropertyConfig?: {
      sortStrategy?: string;
      maxProperties?: number;
      financingEnabled?: boolean;
      planStrategy?: string;
    };
    componentConfig?: Record<string, any>;
    imageSelections?: Record<string, any>;
  };
}

export interface IMailivoAutomation extends Document {
  name: string;
  description: string;
  isActive: boolean;
  userId: string;
  trigger: ITriggerConfig;
  conditions: ICondition[];
  action: IActionConfig;
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    lastRunStatus?: "success" | "failed";
  };
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
}

const TriggerConfigSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ["property_uploaded", "time_based", "property_viewed", "property_updated", "campaign_status_changed", "email_tracking_status", "unsubscribe"],
  },
  config: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

const ConditionSchema = new Schema({
  category: {
    type: String,
    required: true,
    enum: ["property_data", "campaign_data", "email_tracking", "email_template", "buyer_data"],
  },
  conditions: [
    {
      field: { type: String, required: true },
      operator: { type: String, required: true },
      value: { type: Schema.Types.Mixed, required: true },
      secondValue: { type: Schema.Types.Mixed },
      linkText: { type: String },
    },
  ],
  matchAll: { type: Boolean, default: true },
});

const ActionConfigSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ["send_campaign"],
  },
  config: {
    campaignType: {
      type: String,
      required: true,
      enum: ["single_property", "multi_property"],
    },
    campaignCounter: { type: Number, default: 0 },
    propertySelection: {
      source: {
        type: String,
        required: true,
        enum: ["trigger", "condition", "manual"],
      },
      propertyIds: [{ type: String }],
    },
    emailList: { type: String, required: true },
    emailTemplate: { type: String, required: true },
    selectedAgent: { type: String },
    schedule: {
      type: String,
      required: true,
      enum: ["immediate", "scheduled", "time_delay"],
    },
    scheduledDate: { type: Date },
    delay: {
      amount: { type: Number },
      unit: {
        type: String,
        enum: ["minutes", "hours", "days"],
      },
    },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String },
    multiPropertyConfig: {
      sortStrategy: { type: String },
      maxProperties: { type: Number },
      financingEnabled: { type: Boolean },
      planStrategy: { type: String },
    },
    componentConfig: { type: Schema.Types.Mixed },
    imageSelections: { type: Schema.Types.Mixed },
  },
});

const MailivoAutomationSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: false },
    userId: { type: String, required: true, index: true },
    trigger: { type: TriggerConfigSchema, required: true },
    conditions: [ConditionSchema],
    action: { type: ActionConfigSchema, required: true },
    stats: {
      totalRuns: { type: Number, default: 0 },
      successfulRuns: { type: Number, default: 0 },
      failedRuns: { type: Number, default: 0 },
      lastRunStatus: {
        type: String,
        enum: ["success", "failed"],
      },
    },
    lastRunAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes
MailivoAutomationSchema.index({ userId: 1, createdAt: -1 });
MailivoAutomationSchema.index({ userId: 1, isActive: 1 });
MailivoAutomationSchema.index({ "trigger.type": 1, isActive: 1 });

// Automation Execution Log Schema
export interface IAutomationExecution extends Document {
  automationId: mongoose.Types.ObjectId;
  userId: string;
  status: "pending" | "running" | "completed" | "failed";
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
    status: "success" | "failed" | "skipped";
    message?: string;
    data?: any;
  }>;
}

const AutomationExecutionSchema = new Schema(
  {
    automationId: {
      type: Schema.Types.ObjectId,
      ref: "MailivoAutomation",
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    triggeredAt: { type: Date, required: true, default: Date.now },
    triggeredBy: {
      type: { type: String, required: true },
      data: { type: Schema.Types.Mixed },
    },
    completedAt: { type: Date },
    error: { type: String },
    result: {
      campaignId: { type: String },
      recipientCount: { type: Number },
      status: { type: String },
    },
    executionLog: [
      {
        step: { type: String, required: true },
        timestamp: { type: Date, required: true, default: Date.now },
        status: {
          type: String,
          required: true,
          enum: ["success", "failed", "skipped"],
        },
        message: { type: String },
        data: { type: Schema.Types.Mixed },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for execution logs
AutomationExecutionSchema.index({ automationId: 1, createdAt: -1 });
AutomationExecutionSchema.index({ userId: 1, status: 1, createdAt: -1 });
AutomationExecutionSchema.index({ createdAt: -1 }); // For cleanup/archival

export const MailivoAutomation = mongoose.model<IMailivoAutomation>("MailivoAutomation", MailivoAutomationSchema);
export const AutomationExecution = mongoose.model<IAutomationExecution>("AutomationExecution", AutomationExecutionSchema);
