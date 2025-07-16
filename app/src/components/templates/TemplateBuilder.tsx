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
import { EmailComponent, EmailTemplate } from '@/types/template';
import { componentDefinitions } from '@/data/componentDefinitions';
import { ComponentPalette } from './ComponentPalette';
import { CanvasArea } from './CanvasArea';
import { ComponentConfigurator } from './ComponentConfigurator';
import { TemplatePreview } from './TemplatePreview';
import { Save, Eye, Play, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateBuilderProps {
  template?: EmailTemplate;
  onSave: (template: EmailTemplate) => Promise<void>;
  onPreview: (template: EmailTemplate) => void;
  onTest: (template: EmailTemplate) => void;
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
  }, [currentTemplate.components.length]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    // Handle dropping from palette to canvas
    if (active.data.current?.type === 'palette-item') {
      const componentType = active.data.current.componentType;
      addComponent(componentType);
      setActiveId(null);
      return;
    }

    // Handle reordering within canvas
    if (active.id !== over.id) {
      const oldIndex = currentTemplate.components.findIndex(item => item.id === active.id);
      const newIndex = currentTemplate.components.findIndex(item => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setCurrentTemplate(prev => ({
          ...prev,
          components: arrayMove(prev.components, oldIndex, newIndex)
        }));
      }
    }

    setActiveId(null);
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

  const handleSave = async () => {
    try {
      await onSave({
        ...currentTemplate,
        updatedAt: new Date().toISOString()
      });
      toast.success('Template saved successfully!');
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  if (previewMode) {
    return (
      <div className="h-full flex flex-col">
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
    <div className="h-full flex">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Left Sidebar - Component Palette */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-4">Email Components</h2>
            <ComponentPalette onAddComponent={addComponent} />
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="border-b p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <Input
                    value={currentTemplate.name}
                    onChange={(e) => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                    placeholder="Template Name"
                  />
                  <Input
                    value={currentTemplate.description || ''}
                    onChange={(e) => setCurrentTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="text-sm text-muted-foreground border-none p-0 h-auto focus-visible:ring-0"
                    placeholder="Template description..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPreviewMode(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button variant="outline" onClick={() => onTest(currentTemplate)}>
                  <Play className="mr-2 h-4 w-4" />
                  Test
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex">
            <div className="flex-1 p-6 bg-gray-100">
              <CanvasArea
                components={currentTemplate.components}
                selectedComponent={selectedComponent}
                onSelectComponent={setSelectedComponent}
                onUpdateComponent={updateComponent}
                onRemoveComponent={removeComponent}
              />
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

        <DragOverlay>
          {activeId ? (
            <div className="p-4 bg-white border rounded shadow-lg">
              {activeId.startsWith('palette-') ? 'Adding component...' : 'Moving component...'}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}