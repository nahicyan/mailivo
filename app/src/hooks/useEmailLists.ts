// app/src/hooks/useEmailLists.ts
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner'; // or your toast library

export interface EmailList {
  id: string;
  _id?: string;
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
  buyers?: any[];
}

// API functions
const fetchEmailLists = async (): Promise<EmailList[]> => {
  try {
    const { data } = await api.get('/email-lists');
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('Error fetching email lists:', error);
    throw new Error('Failed to fetch email lists');
  }
};

const createEmailListApi = async (listData: any) => {
  const { data } = await api.post('/email-lists', listData);
  return data;
};

const updateEmailListApi = async (listId: string, listData: any) => {
  const { data } = await api.put(`/email-lists/${listId}`, listData);
  return data;
};

const deleteEmailListApi = async (listId: string) => {
  const { data } = await api.delete(`/email-lists/${listId}`);
  return data;
};

// Main hook
export function useEmailLists() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: '' });

  // Query for fetching lists
  const {
    data: lists = [],
    isLoading: loading,
    error,
    refetch: refetchLists
  } = useQuery({
    queryKey: ['email-lists'],
    queryFn: fetchEmailLists,
    staleTime: 5 * 60 * 1000,
    retry: 3
  });

  // Mutations
  const createListMutation = useMutation({
    mutationFn: createEmailListApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-lists'] });
      toast.success('Email list created successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to create email list');
      console.error(error);
    }
  });

  const updateListMutation = useMutation({
    mutationFn: ({ listId, listData }: { listId: string; listData: any }) =>
      updateEmailListApi(listId, listData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-lists'] });
      toast.success('Email list updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update email list');
    }
  });

  const deleteListMutation = useMutation({
    mutationFn: deleteEmailListApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-lists'] });
      toast.success('Email list deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete email list');
    }
  });

  // Apply filters
  const filteredLists = lists.filter(list => {
    if (!filters.search) return true;
    const searchTerm = filters.search.toLowerCase();
    return (
      list.name.toLowerCase().includes(searchTerm) ||
      (list.description && list.description.toLowerCase().includes(searchTerm))
    );
  });

  // Helper functions
  const createList = useCallback(async (listData: any) => {
    return createListMutation.mutateAsync(listData);
  }, [createListMutation]);

  const updateList = useCallback(async (listId: string, listData: any) => {
    return updateListMutation.mutateAsync({ listId, listData });
  }, [updateListMutation]);

  const deleteList = useCallback(async (listId: string) => {
    return deleteListMutation.mutateAsync(listId);
  }, [deleteListMutation]);

  return {
    lists,
    filteredLists,
    loading,
    error: error ? 'Failed to load email lists' : null,
    createList,
    updateList,
    deleteList,
    refetchLists,
    setListFilters: setFilters,
    // Provide these specific properties that the campaign page expects
    emailLists: filteredLists,
    listsLoading: loading,
    listsError: error ? 'Failed to load email lists' : null
  };
}