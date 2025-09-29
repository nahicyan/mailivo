// app/src/hooks/useEmailLists.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface EmailList {
  id: string;
  name: string;
  description?: string;
  totalContacts: number;
  createdAt: string;
  updatedAt: string;
}

async function fetchEmailLists(): Promise<EmailList[]> {
  try {
    const { data } = await api.get('/landivo-email-lists');
    const lists = Array.isArray(data) ? data : (data.lists || []);
    return lists.map((list: any) => ({
      ...list,
      id: list.id || list._id
    }));
  } catch (error: any) {
    console.error('Error fetching email lists:', error);
    throw new Error('Failed to fetch email lists');
  }
}

export function useEmailLists() {
  return useQuery({
    queryKey: ['email-lists'],
    queryFn: fetchEmailLists,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      return error.message.includes('404') ? false : failureCount < 3;
    }
  });
}