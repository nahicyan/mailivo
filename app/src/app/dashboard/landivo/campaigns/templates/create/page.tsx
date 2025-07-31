// app/src/app/dashboard/landivo/campaigns/templates/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';
import { EmailTemplate, EmailComponent } from '@/types/template';
import { templateService } from '@/services/template.service';
import { toast } from 'sonner';

export default function CreateTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Initial empty template
  const [template, setTemplate] = useState<EmailTemplate>({
    id: '',
    name: 'New Template',
    description: '',
    category: 'custom',
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
      const savedTemplate = await templateService.create(updatedTemplate);
      toast.success('Template created successfully');
      router.push('/dashboard/campaigns/templates');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/campaigns/templates');
  };

  return (
    <div className="h-screen flex flex-col">
      <TemplateBuilder
        template={template}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />
    </div>
  );
}