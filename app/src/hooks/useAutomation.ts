// app/src/hooks/useAutomation.ts
import { useState } from 'react';
import { api } from '@/lib/api';
import type { Automation } from '@mailivo/shared-types';

export const useAutomation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAutomation = async (automation: Partial<Automation>, activate: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/automation', {
        ...automation,
        isActive: activate
      });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create automation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateAutomation = async (id: string, automation: Partial<Automation>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(`/automation/${id}`, automation);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update automation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteAutomation = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.delete(`/automation/${id}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete automation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/automation/${id}/toggle`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to toggle automation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateAutomation = async (automation: Partial<Automation>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/automation/validate', automation);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to validate automation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    validateAutomation,
    loading,
    error
  };
};