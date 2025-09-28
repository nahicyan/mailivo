// api/src/models/EmailTracking.model.ts
import { Schema, model, Document } from "mongoose";

// Complete email status type
export type EmailStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "dropped"           // suppression/policy/invalid pre-send
  | "rejected"          // SMTP 5xx at handshake
  | "deferred"          // temp failure; retried later
  | "delivery_delay"    // SES telemetry
  | "unsubscribe"       // user unsubscribed
  | "resubscribe"       // user resubscribed
  | "complaint"         // spam report/feedback loop
  | "rendering_failure" // template/personalization error
  | "bounced"          // permanent delivery failure
  | "failed";          // generic catch-all failure

export interface ILinkMetadata {
  linkId: string;
  originalUrl: string;
  trackingUrl: string;
  linkText?: string;
  componentType?: string;
  componentId?: string;
  position?: number;
}

export interface ILinkClick {
  linkId: string;
  clickedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
}

export interface IEmailTracking extends Document {
  // Core identifiers
  campaignId: string;
  contactId: string;
  contactEmail: string;
  trackingId: string;
  messageId?: string;
  
  // Current status
  status: EmailStatus;
  
  // Status timestamps - one for each possible status
  queuedAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  droppedAt?: Date;
  rejectedAt?: Date;
  deferredAt?: Date;
  deliveryDelayAt?: Date;
  unsubscribeAt?: Date;
  resubscribeAt?: Date;
  complaintAt?: Date;
  renderingFailureAt?: Date;
  bouncedAt?: Date;
  failedAt?: Date;
  
  // Status details
  statusReason?: string;              // Generic reason field for current status
  statusCode?: string;                // DSN or error code
  deferralCount?: number;             // Number of retry attempts for deferred
  complaintType?: "spam" | "abuse" | "fraud" | "virus" | "other";
  bounceType?: "hard" | "soft";
  
  // Delivery attempts
  deliveryAttempts: number;
  lastDeliveryAttempt?: Date;
  
  // Link tracking
  links: ILinkMetadata[];
  linkClicks: ILinkClick[];
  linkStats: Map<
    string,
    {
      clickCount: number;
      firstClick?: Date;
      lastClick?: Date;
      uniqueIPs: string[];
    }
  >;
  
  // Engagement tracking
  openCount: number;
  totalClicks: number;
  uniqueClicks: number;
  
  // Client info
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  
  // Metadata
  tags?: string[];
  customData?: Record<string, any>;
}

const emailTrackingSchema = new Schema<IEmailTracking>(
  {
    // Core identifiers
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
    contactEmail: {
      type: String,
      required: true,
      index: true,
    },
    trackingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    messageId: {
      type: String,
      sparse: true,
      index: true,
    },
    
    // Status
    status: {
      type: String,
      enum: [
        "queued",
        "sent",
        "delivered",
        "opened",
        "clicked",
        "dropped",
        "rejected",
        "deferred",
        "delivery_delay",
        "unsubscribe",
        "resubscribe",
        "complaint",
        "rendering_failure",
        "bounced",
        "failed"
      ],
      default: "queued",
      index: true,
    },
    
    // Status timestamps
    queuedAt: Date,
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    droppedAt: Date,
    rejectedAt: Date,
    deferredAt: Date,
    deliveryDelayAt: Date,
    unsubscribeAt: Date,
    resubscribeAt: Date,
    complaintAt: Date,
    renderingFailureAt: Date,
    bouncedAt: Date,
    failedAt: Date,
    
    // Status details
    statusReason: String,
    statusCode: String,
    deferralCount: {
      type: Number,
      default: 0,
    },
    complaintType: {
      type: String,
      enum: ["spam", "abuse", "fraud", "virus", "other"],
    },
    bounceType: {
      type: String,
      enum: ["hard", "soft"],
    },
    
    // Delivery attempts
    deliveryAttempts: {
      type: Number,
      default: 0,
    },
    lastDeliveryAttempt: Date,
    
    // Link tracking
    links: [
      {
        linkId: { type: String, required: true },
        originalUrl: { type: String, required: true },
        trackingUrl: { type: String, required: true },
        linkText: String,
        componentType: String,
        componentId: String,
        position: Number,
      },
    ],
    
    linkClicks: [
      {
        linkId: { type: String, required: true },
        clickedAt: { type: Date, required: true },
        ipAddress: String,
        userAgent: String,
        referer: String,
      },
    ],
    
    linkStats: {
      type: Map,
      of: {
        clickCount: { type: Number, default: 0 },
        firstClick: Date,
        lastClick: Date,
        uniqueIPs: { type: [String], default: [] },
      },
      default: new Map(),
    },
    
    // Engagement metrics
    openCount: {
      type: Number,
      default: 0,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    uniqueClicks: {
      type: Number,
      default: 0,
    },
    
    // Client info
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String,
      region: String,
    },
    
    // Metadata
    tags: [String],
    customData: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
emailTrackingSchema.index({ campaignId: 1, status: 1 });
emailTrackingSchema.index({ campaignId: 1, contactId: 1 });
emailTrackingSchema.index({ contactEmail: 1, status: 1 });
emailTrackingSchema.index({ status: 1, createdAt: -1 });
emailTrackingSchema.index({ campaignId: 1, openedAt: 1 });
emailTrackingSchema.index({ campaignId: 1, clickedAt: 1 });
emailTrackingSchema.index({ campaignId: 1, bouncedAt: 1 });
emailTrackingSchema.index({ campaignId: 1, complaintAt: 1 });
emailTrackingSchema.index({ messageId: 1 });
emailTrackingSchema.index({ trackingId: 1, "links.linkId": 1 });

// Helper method to update status with automatic timestamp
emailTrackingSchema.methods.setStatus = function(
  newStatus: EmailStatus, 
  details?: {
    reason?: string;
    code?: string;
    type?: string;
  }
) {
  this.status = newStatus;
  
  // Set the corresponding timestamp
  const timestampMap: Record<EmailStatus, string> = {
    queued: 'queuedAt',
    sent: 'sentAt',
    delivered: 'deliveredAt',
    opened: 'openedAt',
    clicked: 'clickedAt',
    dropped: 'droppedAt',
    rejected: 'rejectedAt',
    deferred: 'deferredAt',
    delivery_delay: 'deliveryDelayAt',
    unsubscribe: 'unsubscribeAt',
    resubscribe: 'resubscribeAt',
    complaint: 'complaintAt',
    rendering_failure: 'renderingFailureAt',
    bounced: 'bouncedAt',
    failed: 'failedAt'
  };
  
  const timestampField = timestampMap[newStatus];
  if (timestampField && !this[timestampField]) {
    this[timestampField] = new Date();
  }
  
  // Handle status-specific details
  if (details) {
    if (details.reason) this.statusReason = details.reason;
    if (details.code) this.statusCode = details.code;
    
    if (newStatus === 'complaint' && details.type) {
      this.complaintType = details.type as any;
    }
    if (newStatus === 'bounced' && details.type) {
      this.bounceType = details.type as 'hard' | 'soft';
    }
    if (newStatus === 'deferred') {
      this.deferralCount += 1;
    }
  }
  
  return this.save();
};

// Static method for bulk status update
emailTrackingSchema.statics.bulkUpdateStatus = async function(
  filter: any,
  status: EmailStatus,
  details?: any
) {
  const timestampMap: Record<EmailStatus, string> = {
    queued: 'queuedAt',
    sent: 'sentAt',
    delivered: 'deliveredAt',
    opened: 'openedAt',
    clicked: 'clickedAt',
    dropped: 'droppedAt',
    rejected: 'rejectedAt',
    deferred: 'deferredAt',
    delivery_delay: 'deliveryDelayAt',
    unsubscribe: 'unsubscribeAt',
    resubscribe: 'resubscribeAt',
    complaint: 'complaintAt',
    rendering_failure: 'renderingFailureAt',
    bounced: 'bouncedAt',
    failed: 'failedAt'
  };
  
  const updateData: any = {
    status,
    [timestampMap[status]]: new Date(),
    updatedAt: new Date()
  };
  
  if (details?.reason) updateData.statusReason = details.reason;
  if (details?.code) updateData.statusCode = details.code;
  
  return this.updateMany(filter, { $set: updateData });
};

// Get campaign statistics
emailTrackingSchema.statics.getCampaignStats = async function(campaignId: string) {
  const stats = await this.aggregate([
    { $match: { campaignId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        queued: { $sum: { $cond: [{ $eq: ["$status", "queued"] }, 1, 0] } },
        sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
        opened: { $sum: { $cond: [{ $ne: ["$openedAt", null] }, 1, 0] } },
        clicked: { $sum: { $cond: [{ $ne: ["$clickedAt", null] }, 1, 0] } },
        bounced: { $sum: { $cond: [{ $eq: ["$status", "bounced"] }, 1, 0] } },
        hardBounces: { $sum: { $cond: [{ $eq: ["$bounceType", "hard"] }, 1, 0] } },
        softBounces: { $sum: { $cond: [{ $eq: ["$bounceType", "soft"] }, 1, 0] } },
        complaints: { $sum: { $cond: [{ $eq: ["$status", "complaint"] }, 1, 0] } },
        unsubscribed: { $sum: { $cond: [{ $eq: ["$status", "unsubscribe"] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        dropped: { $sum: { $cond: [{ $eq: ["$status", "dropped"] }, 1, 0] } },
        deferred: { $sum: { $cond: [{ $eq: ["$status", "deferred"] }, 1, 0] } },
        totalOpens: { $sum: "$openCount" },
        totalClicks: { $sum: "$totalClicks" },
        uniqueClicks: { $sum: "$uniqueClicks" }
      }
    }
  ]);
  
  return stats[0] || {};
};

export const EmailTracking = model<IEmailTracking>(
  "EmailTracking",
  emailTrackingSchema
);