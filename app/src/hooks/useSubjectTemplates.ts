// app/src/hooks/useSubjectTemplates.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SubjectLineTemplate, CreateSubjectTemplateRequest, UpdateSubjectTemplateRequest } from '@/types/subject-template';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';

export function useSubjectTemplates(enabledOnly = false) {
  return useQuery<{ templates: SubjectLineTemplate[] }>({
    queryKey: ['subject-templates', enabledOnly],
    queryFn: async () => {
      const params = enabledOnly ? '?enabled=true' : '';
      const response = await fetch(`${API_URL}/api/subject-templates${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });
}

export function useCreateSubjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubjectTemplateRequest) => {
      const response = await fetch(`${API_URL}/api/subject-templates`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-templates'] });
    },
  });
}

export function useUpdateSubjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSubjectTemplateRequest }) => {
      const response = await fetch(`${API_URL}/api/subject-templates/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-templates'] });
    },
  });
}

export function useDeleteSubjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/api/subject-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-templates'] });
    },
  });
}

export function useToggleSubjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/api/subject-templates/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to toggle template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-templates'] });
    },
  });
}