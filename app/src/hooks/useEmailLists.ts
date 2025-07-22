// app/src/hooks/useEmailLists.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  createdAt: string;
  updatedAt: string;
}

async function fetchEmailLists(): Promise<EmailList[]> {
  try {
    const response = await api.get('/email-lists');
    const data = response.data;
    return Array.isArray(data) ? data : (data.emailLists || []);
  } catch (error: any) {
    console.error('Error fetching email lists:', error);
    if (error.response?.status === 404) {
      return []; // Return empty array if no lists found
    }
    throw new Error('Failed to fetch email lists');
  }
}

export function useEmailLists() {
  return useQuery({
    queryKey: ['email-lists'],
    queryFn: fetchEmailLists,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (no lists found)
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
  });
}

// Hook for creating email lists
export function useCreateEmailList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (listData: Partial<EmailList>) => {
      const response = await api.post('/email-lists', listData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-lists'] });
    },
  });
}

// Hook for syncing buyers from Landivo
export function useSyncEmailListBuyers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (listId: string) => {
      const response = await api.post(`/email-lists/${listId}/sync-buyers`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-lists'] });
    },
  });
}