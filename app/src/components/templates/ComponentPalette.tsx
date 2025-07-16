// app/src/components/templates/ComponentPalette.tsx
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { componentDefinitions } from '@/data/componentDefinitions';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';

interface ComponentPaletteProps {
  onAddComponent: (componentType: string) => void;
}

function DraggableComponent({ type, definition, onAdd }: {
  type: string;
  definition: any;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      type: 'palette-item',
      componentType: type,
    },
  });

  return (
    <Card 
      ref={setNodeRef}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-30' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{definition.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium">
              {definition.name}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {definition.description}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  const categories = {
    layout: ['header', 'footer', 'spacer'],
    content: ['text', 'property-highlights', 'property-details'],
    interactive: ['payment-calculator', 'buyer-guidelines']
  };

  return (
    <div className="h-full">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {Object.entries(categories).map(([category, types]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 capitalize">
                {category}
              </h3>
              <div className="space-y-3">
                {types.map(type => {
                  const definition = componentDefinitions.find(def => def.type === type);
                  if (!definition) return null;

                  return (
                    <DraggableComponent
                      key={type}
                      type={type}
                      definition={definition}
                      onAdd={() => onAddComponent(type)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}