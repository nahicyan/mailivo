// app/src/hooks/useTemplates.ts
import { useQuery } from '@tanstack/react-query';

export interface EmailTemplate {
  id: string;
  name: string;
  subject?: string;
  description?: string;
  category?: 'property' | 'general' | 'promotion' | 'newsletter';
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

const mailivoBE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchTemplates(): Promise<EmailTemplate[]> {
  const response = await fetch(`${mailivoBE_URL}/api/templates`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch templates');
  }
  
  const data = await response.json();
  
  // Handle both formats: direct array or { templates: [...] }
  return Array.isArray(data) ? data : (data.templates || []);
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