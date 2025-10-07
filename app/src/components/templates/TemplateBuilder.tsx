// app/src/components/templates/TemplateBuilder.tsx
"use client";

import { useState, useCallback } from "react";
import { EmailTemplate, EmailComponent } from "@/types/template";
import { getComponent } from "@landivo/email-template";
import { TemplateToolbar } from "./TemplateToolbar";
import { EmailCanvas } from "./EmailCanvas";
import { ComponentPalette } from "./ComponentPalette";
import { PropertyPanel } from "./PropertyPanel";
import { PropertySelectionModal } from "./PropertySelectionModal";

interface Property {
  id: string;
  title: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  askingPrice: number;
  sqft: number;
  acre: number;
  status: string;
  imageUrls: string[];
}

interface TemplateBuilderProps {
  template: EmailTemplate;
  templateType?: "single" | "multi"; // ADDED: Template type prop
  onSave: (template: EmailTemplate) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function TemplateBuilder({
  template,
  templateType, // ADDED: Template type
  onSave,
  onCancel,
  saving = false,
}: TemplateBuilderProps) {
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate>(template);
  const [selectedComponent, setSelectedComponent] = useState<EmailComponent | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);

  const handleAddComponent = useCallback(
    (componentType: string) => {
      const componentMeta = getComponent(componentType);
      if (!componentMeta) return;

      // Verify component compatibility with template type
      if (templateType && componentMeta.type !== "any" && componentMeta.type !== templateType) {
        console.warn(`Component ${componentType} is not compatible with ${templateType} template`);
        return;
      }

      // Count existing components of same type for naming and indexing
      const existingOfSameType = currentTemplate.components.filter((comp) => comp.type === componentType);
      const nextIndex = existingOfSameType.length;

      // Generate incremental name
      const baseName = componentMeta.displayName || componentMeta.name;
      const componentName = nextIndex === 0 ? baseName : `${baseName} ${nextIndex + 1}`;

      const newComponent: EmailComponent = {
        id: `${componentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: componentType as any,
        name: componentName,
        icon: "",
        props: { ...componentMeta.defaultProps },
        order: currentTemplate.components.length,
      };

      setCurrentTemplate((prev) => ({
        ...prev,
        components: [...prev.components, newComponent],
      }));

      setSelectedComponent(newComponent);
    },
    [currentTemplate.components, templateType]
  );

  const handleUpdateComponent = useCallback(
    (componentId: string, updates: Partial<EmailComponent>) => {
      setCurrentTemplate((prev) => ({
        ...prev,
        components: prev.components.map((comp) => (comp.id === componentId ? { ...comp, ...updates } : comp)),
      }));

      if (selectedComponent?.id === componentId) {
        setSelectedComponent((prev) => (prev ? { ...prev, ...updates } : null));
      }
    },
    [selectedComponent]
  );

  const handleDeleteComponent = useCallback(
    (componentId: string) => {
      setCurrentTemplate((prev) => ({
        ...prev,
        components: prev.components.filter((comp) => comp.id !== componentId),
      }));

      if (selectedComponent?.id === componentId) {
        setSelectedComponent(null);
      }
    },
    [selectedComponent]
  );

  const handleReorderComponents = useCallback((reorderedComponents: EmailComponent[]) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      components: reorderedComponents.map((comp, index) => ({
        ...comp,
        order: index,
      })),
    }));
  }, []);

  const handleSelectComponent = useCallback((component: EmailComponent | null) => {
    setSelectedComponent(component);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex?: number) => {
      e.preventDefault();
      const componentType = e.dataTransfer.getData("componentType");

      if (!componentType) return;

      const componentMeta = getComponent(componentType);
      if (!componentMeta) return;

      // Verify component compatibility with template type
      if (templateType && componentMeta.type !== "any" && componentMeta.type !== templateType) {
        console.warn(`Component ${componentType} is not compatible with ${templateType} template`);
        return;
      }

      const existingOfSameType = currentTemplate.components.filter((comp) => comp.type === componentType);
      const nextIndex = existingOfSameType.length;
      const baseName = componentMeta.displayName || componentMeta.name;
      const componentName = nextIndex === 0 ? baseName : `${baseName} ${nextIndex + 1}`;

      const newComponent: EmailComponent = {
        id: `${componentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: componentType as any,
        name: componentName,
        icon: "",
        props: { ...componentMeta.defaultProps },
        order: targetIndex !== undefined ? targetIndex : currentTemplate.components.length,
      };

      if (targetIndex !== undefined) {
        const newComponents = [...currentTemplate.components];
        newComponents.splice(targetIndex, 0, newComponent);
        setCurrentTemplate((prev) => ({
          ...prev,
          components: newComponents.map((comp, idx) => ({ ...comp, order: idx })),
        }));
      } else {
        setCurrentTemplate((prev) => ({
          ...prev,
          components: [...prev.components, newComponent],
        }));
      }

      setSelectedComponent(newComponent);
      setDraggedComponent(null);
    },
    [currentTemplate.components, templateType]
  );

  const handleSave = useCallback(() => {
    onSave(currentTemplate);
  }, [currentTemplate, onSave]);

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Component Palette */}
      <div className="w-64 border-r bg-white overflow-hidden flex-shrink-0">
        <ComponentPalette
          onDragStart={setDraggedComponent}
          templateType={templateType} // ADDED: Pass template type
        />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TemplateToolbar
          template={currentTemplate}
          onSave={handleSave}
          onCancel={onCancel}
          onUpdateSettings={(settings) => setCurrentTemplate((prev) => ({ ...prev, settings }))}
          onSelectProperty={() => setPropertyModalOpen(true)}
          selectedProperty={selectedProperty}
          saving={saving}
        />

        <EmailCanvas
          template={currentTemplate}
          selectedComponent={selectedComponent}
          onSelectComponent={handleSelectComponent}
          onUpdateComponent={handleUpdateComponent}
          onDeleteComponent={handleDeleteComponent}
          onReorderComponents={handleReorderComponents}
          onDrop={handleDrop}
          draggedComponent={draggedComponent}
          selectedProperty={selectedProperty}
        />
      </div>

      {/* Right Sidebar - Property Panel */}
      {selectedComponent && (
        <div className="w-80 border-l bg-white overflow-hidden flex-shrink-0">
          <PropertyPanel
            component={selectedComponent}
            onUpdate={(updates) => handleUpdateComponent(selectedComponent.id, updates)}
            onDelete={() => handleDeleteComponent(selectedComponent.id)}
          />
        </div>
      )}

      {/* Property Selection Modal */}
      <PropertySelectionModal
        open={propertyModalOpen}
        onOpenChange={setPropertyModalOpen}
        onSelect={(property) => {
          setSelectedProperty(property);
          setPropertyModalOpen(false);
        }}
      />
    </div>
  );
}
