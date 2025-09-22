// api/src/models/EmailTracking.model.ts
import { Schema, model, Document } from "mongoose";

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

export interface IOpenEvent {
  openedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser?: string;
  os?: string;
  emailClient?: string;
  location?: {
    country?: string;
    city?: string;
  };
}

export interface IEmailTracking extends Document {
  campaignId: string;
  contactId: string;
  trackingId: string; // Add unique tracking ID
  status:
    | "queued"
    | "sent"
    | "delivered"
    | "bounced"
    | "failed"
    | "opened"
    | "clicked";

  // Link tracking additions
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

  // Existing fields...
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

    // NEW optional fields for enhanced tracking
    deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    browser?: string;
    os?: string;
    emailClient?: string;
  }>;

  // NEW enhanced tracking fields
  deviceInfo?: {
    firstOpenDevice?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    browser?: string;
    os?: string;
    emailClient?: string;
  };
  
  bounceType?: 'hard' | 'soft' | 'blocked';
  bounceCategory?: string;
  
  // NEW aggregate counters
  totalOpens?: number;
  uniqueOpens?: number;
  mobileOpens?: number;
  desktopOpens?: number;
}

const emailTrackingSchema = new Schema<IEmailTracking>(
  {
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
      enum: [
        "queued",
        "sent",
        "delivered",
        "bounced",
        "failed",
        "opened",
        "clicked",
      ],
      default: "queued",
      index: true,
    },
    trackingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

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
    clicks: [
      {
        url: { type: String, required: true },
        clickedAt: { type: Date, required: true },
        ipAddress: String,
      },
    ],
  opens: [{
    openedAt: { type: Date, required: true },
    ipAddress: String,
    userAgent: String,
    // NEW optional fields
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown']
    },
    browser: String,
    os: String,
    emailClient: String
  }],
  
  // NEW fields
  deviceInfo: {
    firstOpenDevice: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown']
    },
    browser: String,
    os: String,
    emailClient: String
  },
  
  bounceType: {
    type: String,
    enum: ['hard', 'soft', 'blocked']
  },
  bounceCategory: String,
  
  totalOpens: { type: Number, default: 0 },
  uniqueOpens: { type: Number, default: 0 },
  mobileOpens: { type: Number, default: 0 },
  desktopOpens: { type: Number, default: 0 },
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

export const EmailTracking = model<IEmailTracking>(
  "EmailTracking",
  emailTrackingSchema
);
