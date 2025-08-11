// app/src/components/subject-templates/TemplateManagementModal.tsx
'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RichTextEditor, RichTextEditorRef } from '@/components/RichText/rich-text-editor';
import { useSubjectTemplates, useCreateSubjectTemplate, useUpdateSubjectTemplate, useDeleteSubjectTemplate, useToggleSubjectTemplate } from '@/hooks/useSubjectTemplates';
import { PROPERTY_VARIABLES, SubjectLineTemplate } from '@/types/subject-template';
import { Settings, Plus, Edit, Power, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateManagementModal({ open, onOpenChange }: Props) {
  const [editingTemplate, setEditingTemplate] = useState<SubjectLineTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const richTextRef = useRef<RichTextEditorRef>(null);

  const { data, isLoading } = useSubjectTemplates();
  const createMutation = useCreateSubjectTemplate();
  const updateMutation = useUpdateSubjectTemplate();
  const deleteMutation = useDeleteSubjectTemplate();
  const toggleMutation = useToggleSubjectTemplate();

  const templates = data?.templates || [];

  const handleSave = async () => {
    if (!templateName.trim() || !templateContent.trim()) {
      toast.error('Name and content are required');
      return;
    }

    // Extract variables from content
    const variables = PROPERTY_VARIABLES
      .filter(variable => templateContent.includes(`{${variable.key}}`))
      .map(variable => variable.key);

    try {
      if (editingTemplate) {
        await updateMutation.mutateAsync({
          id: editingTemplate.id,
          data: {
            name: templateName,
            content: templateContent,
            variables
          }
        });
        toast.success('Template updated successfully');
      } else {
        await createMutation.mutateAsync({
          name: templateName,
          content: templateContent,
          variables
        });
        toast.success('Template created successfully');
      }

      handleCancel();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleEdit = (template: SubjectLineTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateContent(template.content);
    setIsCreating(true);
    // Set content in rich text editor
    setTimeout(() => {
      richTextRef.current?.setContent(template.content);
    }, 100);
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setIsCreating(false);
    setTemplateName('');
    setTemplateContent('');
    richTextRef.current?.clear();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Template deleted successfully');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleMutation.mutateAsync(id);
    } catch (error) {
      toast.error('Failed to toggle template');
    }
  };


const insertVariable = (variableKey: string) => {
  const variableText = `{${variableKey}}`;
  richTextRef.current?.insertAtCursor(variableText);
  const updatedContent = richTextRef.current?.getContent() || '';
  setTemplateContent(updatedContent);
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] sm:max-w-6xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Subject Line Templates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create/Edit Form */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              {!isCreating && (
                <Button onClick={() => setIsCreating(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              )}
            </div>

            {isCreating && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Form */}
                <div className="space-y-4">
                  <div className="space-y-2 mb-6 lg:mb-8">
                    <Label>Template Name *</Label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Price Reduction Alert"
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2 mb-6 lg:mb-8">
                    <Label>Insert Variables</Label>
                    <Select onValueChange={insertVariable}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a variable to insert" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_VARIABLES.map((variable) => (
                          <SelectItem key={variable.key} value={variable.key}>
                            <div className="flex flex-col">
                              <span className="font-medium">{variable.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {variable.example}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingTemplate ? 'Update' : 'Create'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>

                {/* Right Side - Rich Text Editor */}
                <div className="space-y-2">
                  <Label>Template Content *</Label>
                  <RichTextEditor
                    ref={richTextRef}
                    value={templateContent}
                    onChange={setTemplateContent}
                    placeholder="Enter your subject line template..."
                    maxLength={500}
                    showToolbar={true}
                    showEmojiPicker={true}
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use variables like {'{zoning}'} that will be replaced with actual property data
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Templates Table */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Existing Templates</h3>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No templates found. Create your first template above.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Content Preview</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        {template.name}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div
                          className="text-sm text-muted-foreground truncate"
                          dangerouslySetInnerHTML={{ __html: template.content }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((variable) => (
                            <Badge key={variable} variant="secondary" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.isEnabled ? 'default' : 'secondary'}>
                          {template.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggle(template.id)}
                            disabled={toggleMutation.isPending}
                          >
                            <Power className={`h-4 w-4 ${template.isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(template.id, template.name)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}