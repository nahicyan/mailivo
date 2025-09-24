// app/src/types/analytics.ts
export interface CampaignAnalytics {
  campaign: Campaign;
  clickedContacts: ContactClick[];
  linkPerformance: LinkPerformance[];
  timelineData: TimelineData[];
  deviceData: DeviceData[];
  locationData: LocationData[];
}

export interface Campaign {
  _id: string;
  name: string;
  subject: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  metrics: {
    sent: number;
    delivered: number;
    open: number;
    clicks: number;
    totalClicks: number;
    bounces: number;
    uniqueClickers: number;
    mobileOpen?: number;
    avgClicksPerLink?: number;
    clickThroughRate?: number;
    topLink?: string;
  };
}

export interface ContactClick {
  contactId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  totalClicks: number;
  uniqueLinks: number;
  firstClick: string;
  lastClick: string;
  devices: string[];
  locations: string[];
  engagementScore: number;
}

export interface ClickDetail {
  linkId: string;
  linkText: string;
  originalUrl: string;
  clickedAt: string;
  ipAddress: string;
  userAgent: string;
  referer: string;
  device: string;
  location?: string;
}

export interface LinkPerformance {
  linkId: string;
  linkText: string;
  originalUrl: string;
  clickCount: number;
  uniqueClickers: number;
  clickRate: number;
  avgTimeToClick: number;
}

export interface TimelineData {
  hour: string;
  clicks: number;
  opens: number;
}

export interface DeviceData {
  device: string;
  clicks: number;
  percentage: number;
}

export interface LocationData {
  location: string;
  clicks: number;
  percentage: number;
}