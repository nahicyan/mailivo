// app/src/components/templates/TemplateBuilder.tsx
'use client';

import { useState, useCallback } from 'react';
import { EmailTemplate, EmailComponent } from '@/types/template';
import { TemplateToolbar } from './TemplateToolbar';
import { EmailCanvas } from './EmailCanvas';
import { ComponentPalette } from './ComponentPalette';
import { PropertyPanel } from './PropertyPanel';

interface TemplateBuilderProps {
  template: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function TemplateBuilder({ 
  template, 
  onSave, 
  onCancel, 
  saving = false 
}: TemplateBuilderProps) {
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate>(template);
  const [selectedComponent, setSelectedComponent] = useState<EmailComponent | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);

  const handleAddComponent = useCallback((componentType: string) => {
    const newComponent: EmailComponent = {
      id: `${componentType}-${Date.now()}`,
      type: componentType as any,
      name: componentType === 'header' ? 'Header' : 'Component',
      icon: '📧',
      props: {},
      order: currentTemplate.components.length
    };

    setCurrentTemplate(prev => ({
      ...prev,
      components: [...prev.components, newComponent],
      updatedAt: new Date().toISOString()
    }));

    setSelectedComponent(newComponent);
  }, [currentTemplate.components.length]);

  const handleUpdateComponent = useCallback((componentId: string, updates: Partial<EmailComponent>) => {
    setCurrentTemplate(prev => ({
      ...prev,
      components: prev.components.map(comp =>
        comp.id === componentId ? { ...comp, ...updates } : comp
      ),
      updatedAt: new Date().toISOString()
    }));

    if (selectedComponent?.id === componentId) {
      setSelectedComponent(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedComponent]);

  const handleDeleteComponent = useCallback((componentId: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      components: prev.components.filter(comp => comp.id !== componentId),
      updatedAt: new Date().toISOString()
    }));

    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  }, [selectedComponent]);

  const handleReorderComponents = useCallback((components: EmailComponent[]) => {
    setCurrentTemplate(prev => ({
      ...prev,
      components: components.map((comp, index) => ({ ...comp, order: index })),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const handleSave = () => {
    if (!currentTemplate.name.trim()) {
      alert('Please enter a template name');
      return;
    }
    onSave(currentTemplate);
  };

  const handleTemplateNameChange = (name: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      name,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleTemplateDescriptionChange = (description: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      description,
      updatedAt: new Date().toISOString()
    }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <TemplateToolbar
        template={currentTemplate}
        onSave={handleSave}
        onCancel={onCancel}
        onNameChange={handleTemplateNameChange}
        onDescriptionChange={handleTemplateDescriptionChange}
        saving={saving}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 flex">
          <EmailCanvas
            template={currentTemplate}
            selectedComponent={selectedComponent}
            onSelectComponent={setSelectedComponent}
            onUpdateComponent={handleUpdateComponent}
            onDeleteComponent={handleDeleteComponent}
            onReorderComponents={handleReorderComponents}
            draggedComponent={draggedComponent}
            onDragOver={(componentType) => setDraggedComponent(componentType)}
            onDragLeave={() => setDraggedComponent(null)}
            onDrop={handleAddComponent}
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <ComponentPalette onDragStart={setDraggedComponent} />
        </div>
      </div>

      {/* Property Panel (if component selected) */}
      {selectedComponent && (
        <PropertyPanel
          component={selectedComponent}
          onUpdate={(updates) => handleUpdateComponent(selectedComponent.id, updates)}
          onClose={() => setSelectedComponent(null)}
        />
      )}
    </div>
  );
}