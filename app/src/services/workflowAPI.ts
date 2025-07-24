// app/src/services/workflowAPI.ts
import { api } from '@/lib/api';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  subtype: string;
  title: string;
  description: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowConnection {
  from: string;
  to: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  createdAt?: string;
  updatedAt?: string;
}

interface WorkflowParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const workflowAPI = {
  async getWorkflows(params?: WorkflowParams) {
    const { data } = await api.get('/workflows', { params });
    return data;
  },

  async getWorkflow(id: string) {
    const { data } = await api.get(`/workflows/${id}`);
    return data;
  },

  async createWorkflow(workflow: Partial<Workflow>) {
    const { data } = await api.post('/workflows', workflow);
    return data;
  },

  async updateWorkflow(id: string, workflow: Partial<Workflow>) {
    const { data } = await api.put(`/workflows/${id}`, workflow);
    return data;
  },

  async deleteWorkflow(id: string) {
    const { data } = await api.delete(`/workflows/${id}`);
    return data;
  },

  async toggleWorkflow(id: string, isActive: boolean) {
    const { data } = await api.put(`/workflows/${id}`, { isActive });
    return data;
  },

  async duplicateWorkflow(id: string) {
    const { data } = await api.post(`/workflows/${id}/duplicate`);
    return data;
  },

  async getWorkflowExecutions(id: string, params?: { page?: number; limit?: number }) {
    const { data } = await api.get(`/workflows/${id}/executions`, { params });
    return data;
  },

  async executeWorkflow(id: string, contactIds: string[]) {
    const { data } = await api.post(`/workflows/${id}/execute`, { contactIds });
    return data;
  },
};