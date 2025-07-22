// app/src/hooks/useEmailLists.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface EmailList {
  id: string;
  name: string;
  description: string;
  totalContacts: number;
  lastSyncAt: string;
  buyerCriteria?: {
    qualified?: boolean;
    minPrice?: number;
    maxPrice?: number;
    minIncome?: number;
    creditScore?: number;
  };
}

async function fetchEmailLists(): Promise<EmailList[]> {
  try {
    const { data } = await api.get('/email-lists');
    return Array.isArray(data) ? data : (data.emailLists || []);
  } catch (error: any) {
    console.error('Error fetching email lists:', error);
    throw new Error('Failed to fetch email lists');
  }
}

export function useEmailLists() {
  return useQuery({
    queryKey: ['email-lists'],
    queryFn: fetchEmailLists,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      return error.message.includes('404') ? false : failureCount < 3;
    }
  });
}