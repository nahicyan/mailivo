// app/src/components/templates/TemplateBuilder.tsx
'use client';

import { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmailComponent, EmailTemplate } from '@/types/template';
import { componentDefinitions } from '@/data/componentDefinitions';
import { ComponentPalette } from './ComponentPalette';
import { CanvasArea } from './CanvasArea';
import { ComponentConfigurator } from './ComponentConfigurator';
import { TemplatePreview } from './TemplatePreview';
import {
  Eye,
  Play,
  Save,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface TemplateBuilderProps {
  template?: EmailTemplate;
  onSave: (template: EmailTemplate) => Promise<void>;
  onPreview: (template: EmailTemplate) => void;
  onTest: (template: EmailTemplate) => void;
}

interface ValidationError {
  field: string;
  message: string;
}

export function TemplateBuilder({ template, onSave, onPreview, onTest }: TemplateBuilderProps) {
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate>(
    template || {
      id: '',
      name: 'New Template',
      description: '',
      category: 'property',
      components: [],
      settings: {
        backgroundColor: '#f9fafb',
        primaryColor: '#16a34a',
        fontFamily: 'Arial, sans-serif'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );

  const [selectedComponent, setSelectedComponent] = useState<EmailComponent | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Validation function
  const validateTemplate = (template: EmailTemplate): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validate name
    if (!template.name || template.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Template name is required' });
    } else if (template.name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Template name cannot exceed 100 characters' });
    }

    // Validate components
    if (!template.components || template.components.length === 0) {
      errors.push({ field: 'components', message: 'Template must have at least one component' });
    }

    // Validate description length
    if (template.description && template.description.length > 500) {
      errors.push({ field: 'description', message: 'Description cannot exceed 500 characters' });
    }

    return errors;
  };

  const addComponent = useCallback((componentType: string) => {
    const definition = componentDefinitions.find(def => def.type === componentType);
    if (!definition) return;

    const newComponent: EmailComponent = {
      id: `${componentType}-${Date.now()}`,
      type: componentType as any,
      name: definition.name,
      icon: definition.icon,
      props: { ...definition.defaultProps },
      order: currentTemplate.components.length
    };

    setCurrentTemplate(prev => ({
      ...prev,
      components: [...prev.components, newComponent]
    }));

    // Clear validation errors for components if we now have components
    setValidationErrors(prev => prev.filter(error => error.field !== 'components'));
  }, [currentTemplate.components.length]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over) {
      return;
    }

    // Handle dropping from palette to canvas
    if (active.data.current?.type === 'palette-item') {
      const componentType = active.data.current.componentType;
      addComponent(componentType);
      return;
    }

    // Handle reordering within canvas
    if (active.id !== over.id && over.id !== 'canvas-area') {
      const oldIndex = currentTemplate.components.findIndex(item => item.id === active.id);
      const newIndex = currentTemplate.components.findIndex(item => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setCurrentTemplate(prev => ({
          ...prev,
          components: arrayMove(prev.components, oldIndex, newIndex)
        }));
      }
    }
  }, [currentTemplate.components, addComponent]);

  const updateComponent = useCallback((id: string, props: Record<string, any>) => {
    setCurrentTemplate(prev => ({
      ...prev,
      components: prev.components.map(comp =>
        comp.id === id ? { ...comp, props: { ...comp.props, ...props } } : comp
      )
    }));
  }, []);

  const removeComponent = useCallback((id: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      components: prev.components.filter(comp => comp.id !== id)
    }));
    setSelectedComponent(null);
  }, []);

  const handleNameChange = (value: string) => {
    setCurrentTemplate(prev => ({ ...prev, name: value }));

    // Clear name validation errors when user starts typing
    if (value.trim().length > 0) {
      setValidationErrors(prev => prev.filter(error => error.field !== 'name'));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setCurrentTemplate(prev => ({ ...prev, description: value }));

    // Clear description validation errors when valid
    if (value.length <= 500) {
      setValidationErrors(prev => prev.filter(error => error.field !== 'description'));
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Validate template
      const errors = validateTemplate(currentTemplate);
      setValidationErrors(errors);

      if (errors.length > 0) {
        toast.error('Please fix validation errors before saving');
        setSaving(false);
        return;
      }

      // Ensure components is properly formatted as an array
      const templateToSave = {
        ...currentTemplate,
        name: currentTemplate.name.trim(),
        components: currentTemplate.components || [],
        updatedAt: new Date().toISOString()
      };

      await onSave(templateToSave);
      toast.success('Template saved successfully!');
    } catch (error: any) {
      console.error('Save error:', error);

      // Handle specific error cases
      if (error.response?.status === 409 || error.message?.includes('duplicate')) {
        setValidationErrors([{ field: 'name', message: 'A template with this name already exists' }]);
        toast.error('A template with this name already exists');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to save template');
      }
    } finally {
      setSaving(false);
    }
  };

  const getFieldError = (field: string) => {
    return validationErrors.find(error => error.field === field);
  };

  if (previewMode) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Template Preview</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              Back to Editor
            </Button>
            <Button onClick={() => onTest(currentTemplate)}>
              <Play className="mr-2 h-4 w-4" />
              Send Test
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <TemplatePreview template={currentTemplate} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Left Sidebar - Component Palette */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white">
            <h2 className="text-lg font-semibold">Email Components</h2>
          </div>
          <div className="flex-1 min-h-0">
            <ComponentPalette onAddComponent={addComponent} />
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-red-50 border-b">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationErrors.map((error, index) => (
                      <div key={index}>{error.message}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Improved Toolbar with better spacing and organization */}
          <div className="border-b bg-white shrink-0">
            {/* Header with title and actions */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Template Builder</h1>
                  <p className="text-sm text-gray-600 mt-1">Design and customize your email template</p>
                </div>

                {/* Action Buttons - Improved layout */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewMode(true)}
                    className="flex items-center gap-2 px-4 py-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onTest(currentTemplate)}
                    disabled={validationErrors.length > 0}
                    className="flex items-center gap-2 px-4 py-2"
                  >
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Test</span>
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || validationErrors.length > 0}
                    className="flex items-center gap-2 px-4 py-2 min-w-[120px]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span className="hidden sm:inline">Save Template</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Template Information Form - Improved layout */}
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template Name */}
                <div className="space-y-2">
                  <Label htmlFor="template-name" className="text-sm font-medium text-gray-700">
                    Template Name *
                  </Label>
                  <Input
                    id="template-name"
                    value={currentTemplate.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`h-10 text-base ${getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    placeholder="Enter template name"
                    required
                  />
                  {getFieldError('name') && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{getFieldError('name')!.message}</span>
                    </div>
                  )}
                </div>

                {/* Template Description */}
                <div className="space-y-2">
                  <Label htmlFor="template-description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <div className="relative">
                    <Input
                      id="template-description"
                      value={currentTemplate.description || ''}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      className={`h-10 text-base pr-16 ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                      placeholder="Add a description for your template"
                      maxLength={500}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs text-gray-500 bg-white px-1">
                        {currentTemplate.description?.length || 0}/500
                      </span>
                    </div>
                  </div>
                  {getFieldError('description') && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{getFieldError('description')!.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Template Stats and Quick Actions */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{currentTemplate.components?.length || 0} Components</span>
                    </div>
                    {currentTemplate.updatedAt && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Last updated: {new Date(currentTemplate.updatedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Status Indicator */}
                  <div className="flex items-center gap-2">
                    {validationErrors.length > 0 ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {validationErrors.length} Error{validationErrors.length > 1 ? 's' : ''}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Ready to save
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 p-6 bg-gray-100">
              <CanvasArea
                components={currentTemplate.components}
                selectedComponent={selectedComponent}
                onSelectComponent={setSelectedComponent}
                onUpdateComponent={updateComponent}
                onRemoveComponent={removeComponent}
              />
              {getFieldError('components') && (
                <div className="mt-4 text-center">
                  <Alert variant="destructive" className="inline-block">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {getFieldError('components')!.message}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>

            {/* Right Sidebar - Component Configurator */}
            {selectedComponent && (
              <div className="w-80 border-l bg-white">
                <ComponentConfigurator
                  component={selectedComponent}
                  onUpdate={(props) => updateComponent(selectedComponent.id, props)}
                  onRemove={() => removeComponent(selectedComponent.id)}
                />
              </div>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeId && activeId.startsWith('palette-') ? (
            <Card className="w-64 bg-white border shadow-xl opacity-95">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📧</span>
                  <div>
                    <h4 className="text-sm font-medium">Adding component...</h4>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}