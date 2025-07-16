// app/src/components/templates/ComponentPalette.tsx
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { componentDefinitions } from '@/data/componentDefinitions';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (componentType: string) => void;
}

export function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  const categories = {
    layout: ['header', 'footer', 'spacer'],
    content: ['text', 'property-highlights', 'property-details'],
    interactive: ['payment-calculator', 'buyer-guidelines']
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4">
        {Object.entries(categories).map(([category, types]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">
              {category}
            </h3>
            <div className="space-y-2">
              {types.map(type => {
                const definition = componentDefinitions.find(def => def.type === type);
                if (!definition) return null;

                return (
                  <Card key={type} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{definition.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">
                            {definition.name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {definition.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onAddComponent(type)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}