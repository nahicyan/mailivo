'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';
import { EmailTemplate } from '@/types/template';
import { templateService } from '@/services/template.service';
import { toast } from 'sonner';

export default function CreateTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const templateType = (searchParams.get('type') as 'single' | 'multi') || 'single';

  const [template, setTemplate] = useState<EmailTemplate>({
    id: '',
    name: 'New Template',
    description: '',
    category: 'custom',
    type: templateType,
    components: [],
    settings: {
      backgroundColor: '#ffffff',
      primaryColor: '#059669',
      fontFamily: 'Arial, sans-serif'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const handleSave = async (updatedTemplate: EmailTemplate) => {
    setSaving(true);
    try {
      // Ensure type is included
      const templateToSave = {
        ...updatedTemplate,
        type: templateType
      };
      const savedTemplate = await templateService.create(templateToSave);
      toast.success('Template created successfully');
      router.push('/dashboard/landivo/campaigns/templates');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/landivo/campaigns/templates');
  };

  return (
    <div className="h-screen flex flex-col">
      <TemplateBuilder
        template={template}
        templateType={templateType}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />
    </div>
  );
}