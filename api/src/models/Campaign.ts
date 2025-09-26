// api/src/models/Campaign.ts - UPDATED FOR MULTI-PROPERTY ARRAYS
import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;

  // Campaign type
  type: "single" | "multi-property";

  // UPDATED: property can be string (single) OR array (multi-property)
  property: string | string[];

  emailList: string;
  emailTemplate: string;
  emailAddressGroup?: string;
  emailSchedule: string;
  emailVolume: number;

  // Image selections (works for both single and multi-property)
  imageSelections?: Record<
    string,
    {
      name?: string;
      propertyId?: string; // For multi-property
      imageIndex: number;
      imageUrl?: string; // For multi-property
      order: number;
    }
  >;

  // UPDATED: selectedPlan can be single object OR array of plans
  selectedPlan?:
    | {
        planNumber: number;
        planName: string;
        downPayment: number;
        loanAmount: number;
        interestRate: number;
        monthlyPayment: number;
      }
    | Array<{
        propertyId: string;
        planNumber: number;
        planName: string;
        downPayment: number;
        loanAmount: number;
        interestRate: number;
        monthlyPayment: number;
      }>
    | null;
  selectedAgent?: string;
  // Optional multi-property metadata
  multiPropertyMeta?: {
    type: "multi-property";
    totalProperties: number;
    financingEnabled: boolean;
    planStrategy?: string;
    propertiesWithFinancing: number;
  };

  // Standard fields
  audienceType?: "all" | "segment" | "landivo";
  segments?: string[];
  estimatedRecipients?: number;
  spamScore?: number;
  sentAt?: Date;
  completedAt?: Date;
  source: "landivo" | "manual" | "api";
  status:
    | "draft"
    | "scheduled"
    | "active"
    | "paused"
    | "sending"
    | "sent"
    | "completed"
    | "failed";

  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    totalRecipients: number;
    open: number;
    bounces: number;
    successfulDeliveries: number;
    clicks: number;
    didNotOpen: number;
    mobileOpen: number;
    failed: number;
    hardBounces?: number;
    softBounces?: number;
  };

  description?: string;
  scheduledDate?: Date;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    htmlContent: { type: String, required: true },
    textContent: { type: String },

    // Campaign type
    type: {
      type: String,
      enum: ["single", "multi-property"],
      required: true,
    },

    // UPDATED: property can be string or array
    property: {
      type: Schema.Types.Mixed, // Allows both string and array
      required: true,
      validate: {
        validator: function (v: any) {
          return typeof v === "string" || Array.isArray(v);
        },
        message: "Property must be string or array",
      },
    },

    emailList: { type: String, required: true },
    emailTemplate: { type: String, required: true },
    emailAddressGroup: { type: String },
    emailSchedule: { type: String, required: true },
    emailVolume: { type: Number, default: 0 },

    // Agent selection for templates with agent profile
    selectedAgent: { type: String, default: null },

    // Image selections (flexible for single and multi-property)
    imageSelections: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // UPDATED: selectedPlan can be object or array
    selectedPlan: {
      type: Schema.Types.Mixed, // Allows object, array, or null
      default: null,
    },

    // Multi-property metadata
    multiPropertyMeta: {
      type: {
        type: String,
        enum: ["multi-property"],
      },
      totalProperties: { type: Number },
      financingEnabled: { type: Boolean },
      planStrategy: { type: String },
      propertiesWithFinancing: { type: Number },
    },

    // Standard fields
    audienceType: {
      type: String,
      enum: ["all", "segment", "landivo"],
      default: "all",
    },
    segments: [{ type: String }],
    estimatedRecipients: { type: Number, default: 0 },
    spamScore: { type: Number, min: 0, max: 10 },
    sentAt: { type: Date },

    source: {
      type: String,
      enum: ["landivo", "manual", "api"],
      default: "manual",
    },
    status: {
      type: String,
      enum: [
        "draft",
        "active",
        "paused",
        "sending",
        "sent",
        "completed",
        "failed",
        "scheduled",
      ],
      default: "draft",
    },

  // Add to the campaign schema
    completedAt: {
      type: Date,
      default: null
    },

    metrics: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      totalClicks: { type: Number, default: 0 }, 
      bounced: { type: Number, default: 0 },
      complained: { type: Number, default: 0 },
      totalRecipients: { type: Number, default: 0 },
      open: { type: Number, default: 0 },
      bounces: { type: Number, default: 0 },
      successfulDeliveries: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      didNotOpen: { type: Number, default: 0 },
      mobileOpen: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }, 
      hardBounces: { type: Number, default: 0 },
      softBounces: { type: Number, default: 0 },
    },

    description: { type: String },
    scheduledDate: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

CampaignSchema.index({ userId: 1, status: 1 });
CampaignSchema.index({ userId: 1, createdAt: -1 });

export const Campaign = mongoose.model<ICampaign>("Campaign", CampaignSchema);
