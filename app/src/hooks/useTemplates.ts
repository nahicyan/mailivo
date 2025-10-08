// app/src/hooks/useTemplates.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface EmailTemplate {
  id: string;
  name: string;
  subject?: string;
  description?: string;
  category?: 'property' | 'general' | 'promotion' | 'newsletter';
  type?: 'single' | 'multi'; // Added for campaign type filtering
  isActive?: boolean;
  components?: Array<{
    id: string;
    type: string;
    name: string;
    icon: string;
    props: Record<string, any>;
    order: number;
  }>;
  settings?: {
    backgroundColor?: string;
    primaryColor?: string;
    fontFamily?: string;
  };
  createdAt: string;
  updatedAt: string;
}

async function fetchTemplates(): Promise<EmailTemplate[]> {
  try {
    const { data } = await api.get('/templates');
    
    // Handle both formats: direct array or { templates: [...] }
    const templates = Array.isArray(data) ? data : (data.templates || []);
    
    // Ensure each template has an id field
    return templates.map((template: any) => ({
      ...template,
      id: template.id || template._id
    }));
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    throw new Error('Failed to fetch email templates');
  }
}

export function useTemplates() {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: fetchTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      return error.message.includes('404') ? false : failureCount < 3;
    }
  });
}