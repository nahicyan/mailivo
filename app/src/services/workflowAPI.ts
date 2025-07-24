// services/workflowAPI.ts
const API_BASE = process.env.NEXT_PUBLIC_MAILIVO_API_URL || 'https://api.mailivo.landivo.com';

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
  lastRunAt?: string;
}

export interface WorkflowStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgExecutionTime: number;
  conversionRate: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  contactId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: string;
  completedAt?: string;
  errors: any[];
  results: Record<string, any>;
}

interface WorkflowParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

class WorkflowAPIService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getWorkflows(params?: WorkflowParams) {
    const queryString = params ? `?${new URLSearchParams(params as any)}` : '';
    return this.request(`/workflows${queryString}`);
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return this.request(`/workflows/${id}`);
  }

  async createWorkflow(workflow: Partial<Workflow>): Promise<Workflow> {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    return this.request(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  }

  async deleteWorkflow(id: string) {
    return this.request(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleWorkflow(id: string, isActive: boolean): Promise<Workflow> {
    return this.request(`/workflows/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async duplicateWorkflow(id: string): Promise<Workflow> {
    return this.request(`/workflows/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async getWorkflowStats(id: string): Promise<WorkflowStats> {
    try {
      return await this.request(`/workflows/${id}/stats`);
    } catch (error) {
      // Return empty stats if endpoint fails
      console.error('Failed to load workflow stats:', error);
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        avgExecutionTime: 0,
        conversionRate: 0
      };
    }
  }

  async getWorkflowExecutions(id: string, params?: { page?: number; limit?: number }) {
    try {
      const queryString = params ? `?${new URLSearchParams(params as any)}` : '';
      return await this.request(`/workflows/${id}/executions${queryString}`);
    } catch (error) {
      // Return empty executions if endpoint fails
      console.error('Failed to load workflow executions:', error);
      return {
        executions: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      };
    }
  }

  async executeWorkflow(id: string, contactIds: string[]) {
    return this.request(`/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ contactIds }),
    });
  }

  // Helper methods for form data
  async getTemplates() {
    try {
      return await this.request('/templates');
    } catch (error) {
      return { templates: [] };
    }
  }

  async getCampaigns() {
    try {
      return await this.request('/campaigns');
    } catch (error) {
      return { campaigns: [] };
    }
  }

  async getEmailLists() {
    try {
      return await this.request('/email-lists');
    } catch (error) {
      return { lists: [] };
    }
  }

  async getContacts(params?: { page?: number; limit?: number; search?: string }) {
    try {
      const queryString = params ? `?${new URLSearchParams(params as any)}` : '';
      return await this.request(`/contacts${queryString}`);
    } catch (error) {
      return { contacts: [] };
    }
  }
}

export const workflowAPI = new WorkflowAPIService();