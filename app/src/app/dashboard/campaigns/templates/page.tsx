// app/src/app/dashboard/campaigns/templates/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { templateService } from '@/services/template.service';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';
import { EmailTemplate } from '@/types/template';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const [templateToCopy, setTemplateToCopy] = useState<EmailTemplate | null>(null);

  const queryClient = useQueryClient();

  const { data: templatesData, refetch } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted successfully');
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete template');
    },
  });

  const copyMutation = useMutation({
    mutationFn: (template: EmailTemplate) => {
      const copyData = {
        ...template,
        id: '', // Remove ID so it creates a new template
        name: `${template.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return templateService.create(copyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template copied successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to copy template');
    },
  });

  const templates = templatesData?.templates || [];

  const handleSaveTemplate = async (template: EmailTemplate) => {
    try {
      if (template.id && selectedTemplate?.id) {
        // Editing existing template
        await templateService.update(template.id, template);
        toast.success('Template updated successfully');
      } else {
        // Creating new template
        await templateService.create(template);
        toast.success('Template created successfully');
      }
      refetch();
      setBuilderOpen(false);
      setSelectedTemplate(null);
    } catch (error: any) {
      throw error; // Let TemplateBuilder handle the error display
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setBuilderOpen(true);
  };

  const handleCopyTemplate = (template: EmailTemplate) => {
    setTemplateToCopy(template);
    setCopyDialogOpen(true);
  };

  const confirmCopy = () => {
    if (templateToCopy) {
      copyMutation.mutate(templateToCopy);
    }
    setCopyDialogOpen(false);
    setTemplateToCopy(null);
  };

  const handleDeleteTemplate = (template: EmailTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete.id);
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setBuilderOpen(true);
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
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template: EmailTemplate) => {
          const templateId = template.id || (template as any)._id;
          return (
            <Card key={templateId} className="hover:shadow-lg transition-shadow">
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
                    {template.components?.length || 0} components
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTemplate({ ...template, id: templateId })}
                      disabled={copyMutation.isPending || deleteMutation.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCopyTemplate({ ...template, id: templateId })}
                      disabled={copyMutation.isPending || deleteMutation.isPending}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteTemplate({ ...template, id: templateId })}
                      disabled={copyMutation.isPending || deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {templates.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first email template to get started
              </p>
              <Button onClick={handleCreateNew}>
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "{templateToDelete?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteDialogOpen(false);
                setTemplateToDelete(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Copy Confirmation Dialog */}
      <AlertDialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to create a copy of the template "{templateToCopy?.name}"? 
              A new template named "{templateToCopy?.name} (Copy)" will be created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setCopyDialogOpen(false);
                setTemplateToCopy(null);
              }}
              disabled={copyMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCopy}
              disabled={copyMutation.isPending}
            >
              {copyMutation.isPending ? 'Copying...' : 'Copy Template'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}