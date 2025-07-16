// app/src/services/template.service.ts
import { api } from '@/lib/api';
import { EmailTemplate } from '@/types/template';

export const templateService = {
  async list(category?: string) {
    const { data } = await api.get('/templates', { params: { category } });
    return data;
  },

  async create(template: Partial<EmailTemplate>) {
    const { data } = await api.post('/templates', template);
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