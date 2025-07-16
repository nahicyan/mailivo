// app/src/app/dashboard/campaigns/templates/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { templateService } from '@/services/template.service';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';
import { EmailTemplate } from '@/types/template';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import Link from 'next/link';

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);

  const { data: templatesData, refetch } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.list(),
  });

  const templates = templatesData?.templates || [];

  const handleSaveTemplate = async (template: EmailTemplate) => {
    if (template.id) {
      await templateService.update(template.id, template);
    } else {
      await templateService.create(template);
    }
    refetch();
    setBuilderOpen(false);
  };

  if (builderOpen) {
    return (
      <TemplateBuilder
        template={selectedTemplate || undefined}
        onSave={handleSaveTemplate}
        onPreview={() => {}}
        onTest={() => {}}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable email templates
          </p>
        </div>
        <Button onClick={() => {
          setSelectedTemplate(null);
          setBuilderOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template: EmailTemplate) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">{template.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {template.components.length} components
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setBuilderOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first email template to get started
              </p>
              <Button onClick={() => setBuilderOpen(true)}>
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}