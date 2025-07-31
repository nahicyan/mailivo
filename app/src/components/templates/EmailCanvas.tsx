// app/src/components/templates/EmailCanvas.tsx
'use client';

import { useState, useRef } from 'react';
import { EmailTemplate, EmailComponent } from '@/types/template';
import { getComponent } from '@/lib/component-registry';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical } from 'lucide-react';

interface EmailCanvasProps {
  template: EmailTemplate;
  selectedComponent: EmailComponent | null;
  onSelectComponent: (component: EmailComponent | null) => void;
  onUpdateComponent: (id: string, updates: Partial<EmailComponent>) => void;
  onDeleteComponent: (id: string) => void;
  onReorderComponents: (components: EmailComponent[]) => void;
  draggedComponent: string | null;
  onDragOver: (componentType: string) => void;
  onDragLeave: () => void;
  onDrop: (componentType: string) => void;
}

export function EmailCanvas({
  template,
  selectedComponent,
  onSelectComponent,
  onUpdateComponent,
  onDeleteComponent,
  onReorderComponents,
  draggedComponent,
  onDragOver,
  onDragLeave,
  onDrop
}: EmailCanvasProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const y = e.clientY - rect.top;
      const componentHeight = 80; // Approximate height per component
      const index = Math.floor(y / componentHeight);
      setDragOverIndex(Math.min(index, template.components.length));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');
    if (componentType) {
      onDrop(componentType);
    }
    setDragOverIndex(null);
    onDragLeave();
  };

  const renderComponent = (component: EmailComponent) => {
    const componentMeta = getComponent(component.type);
    if (!componentMeta) {
      return (
        <div className="p-4 bg-red-100 text-center text-red-600">
          Unknown component: {component.type}
        </div>
      );
    }

    const Component = componentMeta.component;
    const props = { ...componentMeta.defaultProps, ...component.props };
    
    return <Component {...props} />;
  };

  const sortedComponents = [...template.components].sort((a, b) => a.order - b.order);

  return (
    <div className="flex-1 bg-gray-100 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        {/* Email Preview Container */}
        <div 
          ref={canvasRef}
          className="bg-white shadow-lg rounded-lg overflow-hidden min-h-96"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={() => {
            setDragOverIndex(null);
            onDragLeave();
          }}
        >
          {/* Email Header - Always present */}
          <div 
            className="border-b border-gray-200"
            style={{ backgroundColor: template.settings.backgroundColor }}
          >
            <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50">
              Email Preview
            </div>
          </div>

          {/* Drop zone indicator at top */}
          {draggedComponent && dragOverIndex === 0 && (
            <div className="h-2 bg-blue-200 border-2 border-dashed border-blue-400"></div>
          )}

          {/* Email Content */}
          <div className="relative">
            {sortedComponents.length === 0 ? (
              <div className="p-16 text-center">
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 bg-blue-50">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No content here. Drag content from right.
                  </h3>
                  <p className="text-gray-500">
                    Start by dragging the Header component to begin building your email template.
                  </p>
                </div>
              </div>
            ) : (
              sortedComponents.map((component, index) => (
                <div key={component.id}>
                  {/* Component Wrapper */}
                  <div
                    className={`relative group ${
                      selectedComponent?.id === component.id 
                        ? 'ring-2 ring-blue-500 ring-inset' 
                        : 'hover:ring-1 hover:ring-blue-300 hover:ring-inset'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectComponent(component);
                    }}
                  >
                    {/* Component Controls */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="flex items-center space-x-1 bg-white rounded shadow-lg border">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          <GripVertical className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteComponent(component.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Actual Component */}
                    <div className="relative">
                      {renderComponent(component)}
                    </div>

                    {/* Selected indicator */}
                    {selectedComponent?.id === component.id && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {component.name}
                      </div>
                    )}
                  </div>

                  {/* Drop zone between components */}
                  {draggedComponent && dragOverIndex === index + 1 && (
                    <div className="h-2 bg-blue-200 border-2 border-dashed border-blue-400"></div>
                  )}
                </div>
              ))
            )}

            {/* Drop zone at bottom */}
            {draggedComponent && dragOverIndex !== null && dragOverIndex >= sortedComponents.length && (
              <div className="h-2 bg-blue-200 border-2 border-dashed border-blue-400"></div>
            )}
          </div>
        </div>

        {/* Canvas Info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Email Template Preview • {template.components.length} components</p>
        </div>
      </div>
    </div>
  );
}