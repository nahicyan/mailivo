// app/src/services/template.service.ts
import { api } from '@/lib/api';

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'property' | 'newsletter' | 'announcement' | 'custom';
  type?: 'single' | 'multi'; // ADDED: Template type
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
  async list(category?: string, type?: 'single' | 'multi') {
    const params: any = {};
    if (category) params.category = category;
    if (type) params.type = type; // ADDED: Support filtering by type
    
    const { data } = await api.get('/templates', { params });
    return data;
  },

  async get(id: string) {
    const { data } = await api.get(`/templates/${id}`);
    return data;
  },

  async create(template: Partial<EmailTemplate>) {
    console.log('Template service sending:', template);
    
    // Ensure type field is included
    const templateData = {
      ...template,
      type: template.type || 'single' // Default to single if not specified
    };
    
    const { data } = await api.post('/templates', templateData);
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