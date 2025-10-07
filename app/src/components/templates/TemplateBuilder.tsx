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
  templateType?: "single" | "multi";
  onSave: (template: EmailTemplate) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function TemplateBuilder({ template, templateType = "single", onSave, onCancel, saving = false }: TemplateBuilderProps) {
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate>(template);
  const [selectedComponent, setSelectedComponent] = useState<EmailComponent | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);

  const handleAddComponent = useCallback(
    (componentType: string) => {
      const componentMeta = getComponent(componentType);
      if (!componentMeta) return;

      // Count existing components of same type for naming and indexing
      const existingOfSameType = currentTemplate.components.filter((comp) => comp.type === componentType);
      const nextIndex = existingOfSameType.length;

      // Generate incremental name
      const baseName = componentMeta.displayName || componentMeta.name;
      const componentName = nextIndex === 0 ? baseName : `${baseName} ${nextIndex + 1}`;

      // Start with default props from metadata
      let componentProps = { ...componentMeta.defaultProps };

      // Auto-increment specific properties for component types that need it
      if (componentType === "property-image" && nextIndex > 0) {
        componentProps.imageIndex = nextIndex;
      }

      const newComponent: EmailComponent = {
        id: `${componentType}-${Date.now()}`,
        type: componentType as any,
        name: componentName,
        icon: "📧",
        props: componentProps,
        order: currentTemplate.components.length,
      };

      setCurrentTemplate((prev) => ({
        ...prev,
        components: [...prev.components, newComponent],
        updatedAt: new Date().toISOString(),
      }));

      setSelectedComponent(newComponent);
    },
    [currentTemplate.components]
  );

  const handleUpdateComponent = useCallback(
    (componentId: string, updates: Partial<EmailComponent>) => {
      setCurrentTemplate((prev) => ({
        ...prev,
        components: prev.components.map((comp) => (comp.id === componentId ? { ...comp, ...updates } : comp)),
        updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
      }));

      if (selectedComponent?.id === componentId) {
        setSelectedComponent(null);
      }
    },
    [selectedComponent]
  );

  const handleReorderComponents = useCallback((components: EmailComponent[]) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      components: components.map((comp, index) => ({ ...comp, order: index })),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleSave = () => {
    if (!currentTemplate.name.trim()) {
      alert("Please enter a template name");
      return;
    }
    onSave(currentTemplate);
  };

  const handleTemplateNameChange = (name: string) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      name,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleTemplateDescriptionChange = (description: string) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      description,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleOpenSettings = () => {
    setPropertyModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <TemplateToolbar
        template={currentTemplate}
        onSave={handleSave}
        onCancel={onCancel}
        onNameChange={handleTemplateNameChange}
        onDescriptionChange={handleTemplateDescriptionChange}
        onOpenSettings={handleOpenSettings}
        selectedProperty={selectedProperty}
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
            selectedProperty={selectedProperty}
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <ComponentPalette onDragStart={setDraggedComponent} templateType={templateType} />
        </div>
      </div>

      {/* Property Panel (if component selected) */}
      {selectedComponent && (
        <PropertyPanel component={selectedComponent} onUpdate={(updates) => handleUpdateComponent(selectedComponent.id, updates)} onClose={() => setSelectedComponent(null)} />
      )}

      {/* Property Selection Modal */}
      <PropertySelectionModal open={propertyModalOpen} onClose={() => setPropertyModalOpen(false)} onSelectProperty={setSelectedProperty} selectedProperty={selectedProperty} />
    </div>
  );
}
