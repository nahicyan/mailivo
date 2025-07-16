// app/src/components/templates/SortableComponent.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EmailComponent } from '@/types/template';
import { Button } from '@/components/ui/button';
import { GripVertical, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableComponentProps {
  component: EmailComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (props: Record<string, any>) => void;
  onRemove: () => void;
}

export function SortableComponent({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onRemove
}: SortableComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderComponentPreview = () => {
    switch (component.type) {
      case 'header':
        return (
          <div className="p-4 bg-white">
            <h2 className="text-lg font-semibold mb-2">{component.props.title}</h2>
            {component.props.subtitle && (
              <p className="text-gray-600">{component.props.subtitle}</p>
            )}
          </div>
        );
      case 'property-highlights':
        return (
          <div className="p-4 bg-white">
            <div className="grid grid-cols-4 gap-2">
              {component.props.highlights?.slice(0, 4).map((highlight: any, i: number) => (
                <div key={i} className="text-center p-2">
                  <div className="text-sm">{highlight.icon}</div>
                  <div className="text-xs font-medium">{highlight.value}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'payment-calculator':
        return (
          <div className="p-4 bg-white text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              ${component.props.plan?.monthly?.toLocaleString()}/mo
            </div>
            <div className="text-sm text-gray-600">Payment Calculator</div>
          </div>
        );
      case 'spacer':
        return (
          <div 
            className="bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center"
            style={{ height: component.props.height || 20 }}
          >
            <span className="text-xs text-gray-500">Spacer ({component.props.height}px)</span>
          </div>
        );
      case 'text':
        return (
          <div className="p-4 bg-white">
            <div className="text-sm" style={{ textAlign: component.props.textAlign }}>
              {component.props.content?.substring(0, 100)}...
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 bg-white">
            <div className="flex items-center gap-2">
              <span>{component.icon}</span>
              <span className="text-sm font-medium">{component.name}</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative border-2 border-transparent hover:border-blue-200 transition-colors",
        isSelected && "border-blue-500 bg-blue-50/50",
        isDragging && "opacity-50"
      )}
      onClick={onSelect}
    >
      {/* Component Preview */}
      {renderComponentPreview()}

      {/* Overlay Controls */}
      <div className={cn(
        "absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2",
        isSelected && "opacity-100"
      )}>
        <Button
          size="sm"
          variant="secondary"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={onSelect}>
          <Settings className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="destructive" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Component Label */}
      <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium">
        {component.icon} {component.name}
      </div>
    </div>
  );
}