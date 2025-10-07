// app/src/app/dashboard/landivo/campaigns/templates/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';
import { EmailTemplate, EmailComponent } from '@/types/template';
import { templateService } from '@/services/template.service';
import { toast } from 'sonner';
import { Building, Building2 } from 'lucide-react';

export default function CreateTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateType = searchParams.get('type') as 'single' | 'multi' | null;
  
  const [saving, setSaving] = useState(false);

  // Redirect if no type specified
  useEffect(() => {
    if (!templateType || (templateType !== 'single' && templateType !== 'multi')) {
      router.push('/dashboard/landivo/campaigns/templates');
    }
  }, [templateType, router]);

  // Initial empty template with type
  const [template, setTemplate] = useState<EmailTemplate>({
    id: '',
    name: 'New Template',
    description: '',
    category: 'custom',
    type: templateType || 'single',
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
      // Ensure type is set
      const templateWithType = {
        ...updatedTemplate,
        type: templateType
      };
      
      const savedTemplate = await templateService.create(templateWithType);
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

  if (!templateType) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Title Bar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          {templateType === 'single' ? (
            <Building className="h-6 w-6 text-blue-600" />
          ) : (
            <Building2 className="h-6 w-6 text-green-600" />
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {templateType === 'single' ? 'Create Single Property Template' : 'Create Multi Property Template'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {templateType === 'single' 
                ? 'Design a template for featuring individual properties'
                : 'Design a template for showcasing multiple properties'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Template Builder */}
      <div className="flex-1 overflow-hidden">
        <TemplateBuilder
          template={template}
          templateType={templateType}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      </div>
    </div>
  );
}