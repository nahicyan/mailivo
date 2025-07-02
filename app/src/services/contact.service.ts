// app/src/services/contact.service.ts
import { api } from '@/lib/api';

export interface Contact {
  _id: string;
  email: string;
  profile: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  preferences: {
    subscribed: boolean;
    categories: string[];
  };
  segments: string[];
  tracking: {
    total_opens: number;
    total_clicks: number;
    engagement_score: number;
  };
  created_at: string;
}

export const contactService = {
  async list(params?: { page?: number; limit?: number; segments?: string[] }) {
    const { data } = await api.get('/contacts', { params });
    return data;
  },

  async create(contact: Partial<Contact>) {
    const { data } = await api.post('/contacts', contact);
    return data;
  },

  async importContacts(file: FormData) {
    const { data } = await api.post('/contacts/import', file, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async getSegments() {
    const { data } = await api.get('/contacts/segments');
    return data;
  }
};