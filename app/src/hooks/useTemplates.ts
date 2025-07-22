import { useQuery } from '@tanstack/react-query';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description?: string;
  category?: 'property' | 'general' | 'promotion' | 'newsletter';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const mailivoBE_URL = process.env.NEXT_PUBLIC_MAILIVO_API_URL || 'https://api.mailivo.landivo.com';

async function fetchTemplates(): Promise<EmailTemplate[]> {
  const response = await fetch(`${mailivoBE_URL}/api/templates`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch templates');
  }
  
  return response.json();
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