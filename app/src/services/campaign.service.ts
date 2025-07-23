// app/src/services/campaign.service.ts
import { api } from '@/lib/api';

export interface Campaign {
  _id: string;
  name: string;
  subject: string;
  status: string;
  source: 'landivo' | 'manual' | 'api';
  property: string;
  emailList: string;
  emailTemplate: string;
  emailAddressGroup?: string;
  emailSchedule: string;
  emailVolume: number;
  description?: string;
  scheduledDate?: string;
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    bounces: number;
    successfulDeliveries: number;
    didNotOpen: number;
    mobileOpen: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CampaignParams {
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
  search?: string;
}

export const campaignService = {
  async list(params?: CampaignParams) {
    const { data } = await api.get('/campaigns', { params });
    return data;
  },

  async get(id: string) {
    const { data } = await api.get(`/campaigns/${id}`);
    return data;
  },

  async create(campaign: Partial<Campaign>) {
    const { data } = await api.post('/campaigns', campaign);
    return data;
  },

  async update(id: string, campaign: Partial<Campaign>) {
    const { data } = await api.put(`/campaigns/${id}`, campaign);
    return data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/campaigns/${id}`);
    return data;
  },

  async send(id: string) {
    const { data } = await api.post(`/campaigns/${id}/send`);
    return data;
  },

  async getAnalytics(id: string) {
    const { data } = await api.get(`/campaigns/${id}/analytics`);
    return data;
  },

  async pause(id: string) {
    const { data } = await api.post(`/campaigns/${id}/pause`);
    return data;
  },

  async resume(id: string) {
    const { data } = await api.post(`/campaigns/${id}/resume`);
    return data;
  },

  async duplicate(id: string) {
    const { data } = await api.post(`/campaigns/${id}/duplicate`);
    return data;
  },
};