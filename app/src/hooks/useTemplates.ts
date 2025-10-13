// app/src/hooks/useTemplates.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface EmailTemplate {
  id: string;
  name: string;
  subject?: string;
  description?: string;
  category?: 'property' | 'general' | 'promotion' | 'newsletter';
  type?: 'single' | 'multi';
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

async function fetchTemplateById(templateId: string): Promise<EmailTemplate | null> {
  try {
    console.log('🔍 Fetching template with ID:', templateId);
    
    const response = await api.get(`/templates/${templateId}`);
    console.log('📦 Raw API response:', response);
    console.log('📦 Response data:', response.data);
    
    // ⚠️ THE FIX: Extract the template from the nested structure
    const data = response.data.template || response.data;
    
    console.log('📦 Extracted template data:', data);
    
    if (!data) {
      console.warn('⚠️ No data returned for template:', templateId);
      return null;
    }
    
    // Ensure the template has an id field
    const template = {
      ...data,
      id: data.id || data._id
    };
    
    console.log('✅ Processed template:', template);
    console.log('✅ Template name:', template.name);
    
    return template;
  } catch (error: any) {
    console.error(`❌ Error fetching template ${templateId}:`, error);
    console.error('❌ Error details:', error.response?.data || error.message);
    // Return null instead of throwing to handle gracefully
    return null;
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

export function useTemplate(templateId: string | undefined) {
  console.log('🎣 useTemplate hook called with ID:', templateId);
  
  return useQuery({
    queryKey: ['email-template', templateId],
    queryFn: async () => {
      console.log('🔄 Running query function for template:', templateId);
      const result = templateId ? await fetchTemplateById(templateId) : null;
      console.log('🔄 Query function result:', result);
      return result;
    },
    enabled: !!templateId, // Only run query if templateId is provided
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      console.log('🔁 Retry attempt:', failureCount, 'Error:', error);
      return error.message?.includes('404') ? false : failureCount < 2;
    }
  });
}

// Export the fetch function for use outside of React Query
export { fetchTemplateById, fetchTemplates };