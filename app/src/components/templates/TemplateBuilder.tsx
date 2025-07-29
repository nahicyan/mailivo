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
import { LandivoProperty } from '@/types/landivo';
import { componentDefinitions } from '@/data/componentDefinitions';
import { ComponentPalette } from './ComponentPalette';
import { CanvasArea } from './CanvasArea';
import { ComponentConfigurator } from './ComponentConfigurator';
import { TemplatePreview } from './TemplatePreview';
import { PropertySelector } from './PropertySelector';
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
  const [selectedProperty, setSelectedProperty] = useState<LandivoProperty | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Handle property selection
  const handlePropertySelect = (property: LandivoProperty) => {
    setSelectedProperty(property);
    console.log('Selected property for preview:', property.title);
  };

  // Validation function
  const validateTemplate = (template: EmailTemplate): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!template.name || template.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Template name is required' });
    }
    
    if (template.name && template.name.length > 100) {
      errors.push({ field: 'name', message: 'Template name must be less than 100 characters' });
    }
    
    if (template.description && template.description.length > 500) {
      errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
    }

    if (template.components.length === 0) {
      errors.push({ field: 'components', message: 'Template must have at least one component' });
    }

    return errors;
  };

  // Handle adding component
  const handleAddComponent = useCallback((componentType: string) => {
    const definition = componentDefinitions.find(def => def.type === componentType);
    if (!definition) return;

    const newComponent: EmailComponent = {
      id: `${componentType}-${Date.now()}`,
      type: componentType,
      order: currentTemplate.components.length,
      props: { ...definition.defaultProps }
    };

    setCurrentTemplate(prev => ({
      ...prev,
      components: [...prev.components, newComponent]
    }));

    setSelectedComponent(newComponent);
  }, [currentTemplate.components.length]);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Handle dropping from palette to canvas
    if (active.data.current?.type === 'palette-item') {
      const componentType = active.data.current.componentType;
      handleAddComponent(componentType);
      return;
    }

    // Handle reordering within canvas
    if (active.id !== over.id) {
      setCurrentTemplate(prev => ({
        ...prev,
        components: arrayMove(
          prev.components,
          prev.components.findIndex(comp => comp.id === active.id),
          prev.components.findIndex(comp => comp.id === over.id)
        ).map((comp, index) => ({ ...comp, order: index }))
      }));
    }
  }, [handleAddComponent]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle removing component
  const handleRemoveComponent = useCallback((componentId: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      components: prev.components
        .filter(comp => comp.id !== componentId)
        .map((comp, index) => ({ ...comp, order: index }))
    }));

    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  }, [selectedComponent]);

  // Handle updating component
  const handleUpdateComponent = useCallback((componentId: string, updates: Partial<EmailComponent>) => {
    setCurrentTemplate(prev => ({
      ...prev,
      components: prev.components.map(comp =>
        comp.id === componentId ? { ...comp, ...updates } : comp
      )
    }));

    if (selectedComponent?.id === componentId) {
      setSelectedComponent(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedComponent]);

  // Handle template name change with validation
  const handleNameChange = useCallback((name: string) => {
    setCurrentTemplate(prev => ({ ...prev, name }));
    
    // Clear name-related validation errors
    setValidationErrors(prev => prev.filter(error => error.field !== 'name'));
  }, []);

  // Handle template description change
  const handleDescriptionChange = useCallback((description: string) => {
    setCurrentTemplate(prev => ({ ...prev, description }));
    
    // Clear description-related validation errors
    setValidationErrors(prev => prev.filter(error => error.field !== 'description'));
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    const errors = validateTemplate(currentTemplate);
    setValidationErrors(errors);

    if (errors.length > 0) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setSaving(true);
    try {
      const templateToSave = {
        ...currentTemplate,
        updatedAt: new Date().toISOString()
      };
      
      await onSave(templateToSave);
      setCurrentTemplate(templateToSave);
      toast.success('Template saved successfully');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  }, [currentTemplate, onSave]);

  // Get field validation error
  const getFieldError = (field: string) => {
    return validationErrors.find(error => error.field === field);
  };

  // Show preview mode
  if (previewMode) {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
              >
                Back to Editor
              </Button>
              <div>
                <h2 className="text-xl font-semibold">{currentTemplate.name}</h2>
                <p className="text-sm text-gray-600">Template Preview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onTest(currentTemplate)}
                disabled={validationErrors.length > 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Send Test
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <TemplatePreview 
            template={currentTemplate} 
            data={selectedProperty || undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Template Builder</h1>
              <p className="text-sm text-gray-600 mt-1">Design and customize your email template</p>
            </div>

            {/* Action Buttons */}
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

        {/* Template Information Form */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-sm font-medium text-gray-700">
                Template Name *
              </Label>
              <Input
                id="template-name"
                value={currentTemplate.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`h-10 text-base ${getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="Enter template name..."
                maxLength={100}
              />
              {getFieldError('name') && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {getFieldError('name')?.message}
                </p>
              )}
            </div>

            {/* Template Description */}
            <div className="space-y-2">
              <Label htmlFor="template-description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Input
                id="template-description"
                value={currentTemplate.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className={`h-10 text-base ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="Add a description for your template..."
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                {getFieldError('description') && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {getFieldError('description')?.message}
                  </p>
                )}
                <span className="text-xs text-gray-500 ml-auto">
                  {currentTemplate.description.length}/500
                </span>
              </div>
            </div>

            {/* Property Selector */}
            <div className="space-y-2">
              <PropertySelector
                selectedProperty={selectedProperty}
                onPropertySelect={handlePropertySelect}
              />
            </div>
          </div>

          {/* Template Stats */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>{currentTemplate.components.length} Components</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-green-500" />
                <span>Last updated: {currentTemplate.updatedAt ? new Date(currentTemplate.updatedAt).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>
            
            {/* Ready to save indicator */}
            <div className="flex items-center gap-2">
              {validationErrors.length === 0 ? (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready to save
                </Badge>
              ) : (
                <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Left Sidebar - Component Palette */}
          <div className="w-80 border-r bg-white flex flex-col h-full">
            <div className="p-4 border-b flex-shrink-0">
              <h2 className="font-semibold text-gray-900">Email Components</h2>
              <p className="text-sm text-gray-600 mt-1">
                Drag components to build your template
              </p>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <ComponentPalette onAddComponent={handleAddComponent} />
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Tabs defaultValue="canvas" className="flex-1 flex flex-col h-full">
              <div className="border-b bg-white px-4 flex-shrink-0">
                <TabsList className="h-12">
                  <TabsTrigger value="canvas" className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded"></div>
                    Canvas
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Email Preview
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="canvas" className="flex-1 m-0 p-0 overflow-hidden">
                <div className="h-full">
                  <SortableContext
                    items={currentTemplate.components.map(comp => comp.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <CanvasArea
                      template={currentTemplate}
                      selectedComponent={selectedComponent}
                      onSelectComponent={setSelectedComponent}
                      onRemoveComponent={handleRemoveComponent}
                      onUpdateComponent={handleUpdateComponent}
                      propertyData={selectedProperty}
                    />
                  </SortableContext>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 m-0 p-0 overflow-hidden">
                <div className="h-full bg-gray-100">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <TemplatePreview 
                        template={currentTemplate} 
                        data={selectedProperty || undefined}
                      />
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Component Configuration */}
          <div className="w-80 border-l bg-white flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">
                {selectedComponent ? 'Component Settings' : 'Template Settings'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedComponent 
                  ? `Configure ${componentDefinitions[selectedComponent.type]?.name}`
                  : 'Select a component to configure'
                }
              </p>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-4">
                <ComponentConfigurator
                  component={selectedComponent}
                  onUpdate={handleUpdateComponent}
                  template={currentTemplate}
                  onUpdateTemplate={setCurrentTemplate}
                />
              </div>
            </ScrollArea>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeId ? (
              <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-lg">
                <div className="text-sm font-medium text-gray-900">
                  Moving component...
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="border-t bg-red-50 px-6 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h4>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}