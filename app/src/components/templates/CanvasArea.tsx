// app/src/components/templates/CanvasArea.tsx
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { EmailComponent } from '@/types/template';
import { SortableComponent } from './SortableComponent';

interface CanvasAreaProps {
  components: EmailComponent[];
  selectedComponent: EmailComponent | null;
  onSelectComponent: (component: EmailComponent) => void;
  onUpdateComponent: (id: string, props: Record<string, any>) => void;
  onRemoveComponent: (id: string) => void;
}

export function CanvasArea({
  components,
  selectedComponent,
  onSelectComponent,
  onUpdateComponent,
  onRemoveComponent
}: CanvasAreaProps) {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="border-b p-4 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700">Email Preview</h3>
      </div>
      
      <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-96">
          {components.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg mb-2">Start building your email template</p>
              <p className="text-sm">Drag components from the left panel to get started</p>
            </div>
          ) : (
            components.map((component) => (
              <SortableComponent
                key={component.id}
                component={component}
                isSelected={selectedComponent?.id === component.id}
                onSelect={() => onSelectComponent(component)}
                onUpdate={(props) => onUpdateComponent(component.id, props)}
                onRemove={() => onRemoveComponent(component.id)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}