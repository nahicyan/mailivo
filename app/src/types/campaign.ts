export interface Campaign {
  id: string;
  name: string;
  property: string;
  emailList: string;
  emailTemplate: string;
  emailAddressGroup: string;
  emailSchedule: string;
  emailVolume: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  metrics: {
    open: number;
    sent: number;
    bounces: number;
    successfulDeliveries: number;
    clicks: number;
    didNotOpen: number;
    mobileOpen: number;
  };
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  description?: string;
}

export interface CreateCampaignRequest {
  name: string;
  property: string;
  emailList: string;
  emailTemplate: string;
  emailAddressGroup: string;
  emailSchedule: string;
  emailVolume: number;
  description?: string;
  scheduledDate?: string;
  imageSelections?: Record<string, {
    name: string;
    imageIndex: number;
    order: number;
  }>;
}

export interface CampaignMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSent: number;
  averageOpenRate: number;
  averageClickRate: number;
}