
// ===== Campaign Service (app/src/services/campaign.service.ts) =====
import { api } from '@/lib/api';

export interface Campaign {
  _id: string;
  name: string;
  subject: string;
  status: string;
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
  };
  created_at: string;
  updated_at: string;
}

export const campaignService = {
  async list(params?: { page?: number; limit?: number; status?: string }) {
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
};