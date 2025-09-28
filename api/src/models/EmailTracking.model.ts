// api/src/models/EmailTracking.model.ts
import { Schema, model, Document } from "mongoose";

// Complete email status type with new statuses
export type EmailStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "failed"
  // New statuses
  | "dropped"           // suppression/policy/invalid pre-send
  | "rejected"          // SMTP 5xx at handshake
  | "deferred"          // temp failure; retried later
  | "delivery_delay"    // SES telemetry
  | "unsubscribe"       // user unsubscribed
  | "resubscribe"       // user resubscribed
  | "complaint"         // spam report/feedback loop
  | "rendering_failure"; // template/personalization error

export interface ILinkMetadata {
  linkId: string;
  originalUrl: string;
  trackingUrl: string;
  linkText: string;
  componentType: string;
  componentId: string;
  position: number;
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
  trackingId: string;
  messageId?: string;
  contactEmail?: string;
  
  // Status
  status: EmailStatus;
  
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
  
  // All timestamp fields
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  // New timestamp fields
  droppedAt?: Date;
  rejectedAt?: Date;
  deferredAt?: Date;
  deliveryDelayAt?: Date;
  unsubscribeAt?: Date;
  resubscribeAt?: Date;
  complaintAt?: Date;
  renderingFailureAt?: Date;
  failedAt?: Date;
  
  // Error and reason fields (keeping for compatibility)
  error?: string;
  bounceReason?: string;
  
  // New reason fields for new statuses
  dropReason?: string;
  rejectReason?: string;
  deferralReason?: string;
  complaintType?: "spam" | "abuse" | "fraud" | "virus" | "other";
  renderingError?: string;
  
  // Bounce details
  bounceType?: "hard" | "soft" | "unknown";
  dsn?: string;
  
  // Delivery tracking
  deliveryAttempts?: number;
  lastDeliveryAttempt?: Date;
  deferralCount?: number;
  
  // Client info
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
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
    trackingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    messageId: {
      type: String,
      index: true,
      sparse: true,
    },
    contactEmail: {
      type: String,
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
        "bounced",
        "failed",
        // New statuses
        "dropped",
        "rejected",
        "deferred",
        "delivery_delay",
        "unsubscribe",
        "resubscribe",
        "complaint",
        "rendering_failure",
      ],
      default: "queued",
      index: true,
    },
    
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
    
    // Existing timestamp fields
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    bouncedAt: Date,
    
    // New timestamp fields
    droppedAt: Date,
    rejectedAt: Date,
    deferredAt: Date,
    deliveryDelayAt: Date,
    unsubscribeAt: Date,
    resubscribeAt: Date,
    complaintAt: Date,
    renderingFailureAt: Date,
    failedAt: Date,
    
    // Error and reason fields (keeping for compatibility)
    error: String,
    bounceReason: String,
    
    // New reason fields
    dropReason: String,
    rejectReason: String,
    deferralReason: String,
    complaintType: {
      type: String,
      enum: ["spam", "abuse", "fraud", "virus", "other"],
    },
    renderingError: String,
    
    // Bounce details
    bounceType: {
      type: String,
      enum: ["hard", "soft", "unknown"],
    },
    dsn: String,
    
    // Delivery tracking
    deliveryAttempts: {
      type: Number,
      default: 0,
    },
    lastDeliveryAttempt: Date,
    deferralCount: {
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics queries
emailTrackingSchema.index({ campaignId: 1, contactId: 1 });
emailTrackingSchema.index({ campaignId: 1, status: 1 });
emailTrackingSchema.index({ campaignId: 1, sentAt: 1 });
emailTrackingSchema.index({ contactId: 1, sentAt: -1 });
emailTrackingSchema.index({ trackingId: 1, "links.linkId": 1 });
emailTrackingSchema.index({ campaignId: 1, "linkClicks.linkId": 1 });

// New indexes for new status fields
emailTrackingSchema.index({ campaignId: 1, complaintAt: 1 });
emailTrackingSchema.index({ campaignId: 1, unsubscribeAt: 1 });
emailTrackingSchema.index({ status: 1, deferredAt: 1 });

// Helper method to update status with automatic timestamp
emailTrackingSchema.methods.updateStatus = function(
  newStatus: EmailStatus,
  details?: {
    reason?: string;
    code?: string;
    type?: string;
    error?: string;
  }
) {
  this.status = newStatus;
  
  // Set the corresponding timestamp
  const timestampMap: Record<EmailStatus, keyof IEmailTracking> = {
    queued: 'sentAt', // queued doesn't need a timestamp as it uses createdAt
    sent: 'sentAt',
    delivered: 'deliveredAt',
    opened: 'openedAt',
    clicked: 'clickedAt',
    bounced: 'bouncedAt',
    failed: 'failedAt',
    dropped: 'droppedAt',
    rejected: 'rejectedAt',
    deferred: 'deferredAt',
    delivery_delay: 'deliveryDelayAt',
    unsubscribe: 'unsubscribeAt',
    resubscribe: 'resubscribeAt',
    complaint: 'complaintAt',
    rendering_failure: 'renderingFailureAt',
  };
  
  const timestampField = timestampMap[newStatus];
  if (timestampField && !this[timestampField]) {
    (this as any)[timestampField] = new Date();
  }
  
  // Handle status-specific details
  if (details) {
    switch(newStatus) {
      case 'bounced':
        if (details.reason) this.bounceReason = details.reason;
        if (details.type) this.bounceType = details.type as 'hard' | 'soft';
        if (details.code) this.dsn = details.code;
        break;
      case 'failed':
        if (details.error) this.error = details.error;
        if (details.reason) this.error = details.reason;
        break;
      case 'dropped':
        if (details.reason) this.dropReason = details.reason;
        if (details.code) this.dsn = details.code;
        break;
      case 'rejected':
        if (details.reason) this.rejectReason = details.reason;
        if (details.code) this.dsn = details.code;
        break;
      case 'deferred':
        if (details.reason) this.deferralReason = details.reason;
        this.deferralCount = (this.deferralCount || 0) + 1;
        break;
      case 'complaint':
        if (details.type) this.complaintType = details.type as any;
        break;
      case 'rendering_failure':
        if (details.error) this.renderingError = details.error;
        break;
    }
  }
  
  return this.save();
};

// Static method for campaign statistics
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
        failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        // New status counts
        dropped: { $sum: { $cond: [{ $eq: ["$status", "dropped"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        deferred: { $sum: { $cond: [{ $eq: ["$status", "deferred"] }, 1, 0] } },
        complaints: { $sum: { $cond: [{ $eq: ["$status", "complaint"] }, 1, 0] } },
        unsubscribed: { $sum: { $cond: [{ $eq: ["$status", "unsubscribe"] }, 1, 0] } },
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        queued: 1,
        sent: 1,
        delivered: 1,
        opened: 1,
        clicked: 1,
        bounced: 1,
        hardBounces: 1,
        softBounces: 1,
        failed: 1,
        dropped: 1,
        rejected: 1,
        deferred: 1,
        complaints: 1,
        unsubscribed: 1,
        // Calculate rates
        deliveryRate: {
          $cond: [
            { $eq: ["$total", 0] },
            0,
            { $multiply: [{ $divide: ["$delivered", "$total"] }, 100] }
          ]
        },
        openRate: {
          $cond: [
            { $eq: ["$delivered", 0] },
            0,
            { $multiply: [{ $divide: ["$opened", "$delivered"] }, 100] }
          ]
        },
        clickRate: {
          $cond: [
            { $eq: ["$delivered", 0] },
            0,
            { $multiply: [{ $divide: ["$clicked", "$delivered"] }, 100] }
          ]
        },
        bounceRate: {
          $cond: [
            { $eq: ["$total", 0] },
            0,
            { $multiply: [{ $divide: ["$bounced", "$total"] }, 100] }
          ]
        },
      }
    }
  ]);
  
  return stats[0] || {};
};

export const EmailTracking = model<IEmailTracking>(
  "EmailTracking",
  emailTrackingSchema
);