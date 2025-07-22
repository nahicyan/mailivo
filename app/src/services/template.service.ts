// app/src/services/template.service.ts
import { api } from '@/lib/api';

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'property' | 'newsletter' | 'announcement' | 'custom';
  components: Array<{
    id: string;
    type: string;
    name: string;
    icon: string;
    props: Record<string, any>;
    order: number;
  }>;
  settings: {
    backgroundColor?: string;
    primaryColor?: string;
    fontFamily?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const templateService = {
  async list(category?: string) {
    const { data } = await api.get('/templates', { params: { category } });
    return data;
  },

  async get(id: string) {
    const { data } = await api.get(`/templates/${id}`);
    return data;
  },

  async create(template: Partial<EmailTemplate>) {
    const { data } = await api.post('/templates', {
      ...template,
      components: template.components || []  
    });
    return data;
  },

  async update(id: string, template: Partial<EmailTemplate>) {
    const { data } = await api.put(`/templates/${id}`, template);
    return data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/templates/${id}`);
    return data;
  },
};