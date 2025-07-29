// app/src/components/templates/CanvasArea.tsx
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { EmailComponent, EmailTemplate } from '@/types/template';
import { LandivoProperty } from '@/types/landivo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { componentDefinitions } from '@/data/componentDefinitions';
import {
  GripVertical,
  Trash2,
  Settings,
  Eye,
  Home,
  FileText,
  Calculator,
  Info,
  Mail,
  Minus,
  Plus,
  ImageIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CanvasAreaProps {
  template: EmailTemplate;
  selectedComponent: EmailComponent | null;
  onSelectComponent: (component: EmailComponent) => void;
  onRemoveComponent: (componentId: string) => void;
  onUpdateComponent: (componentId: string, updates: Partial<EmailComponent>) => void;
  propertyData: LandivoProperty | null;
}

interface SortableComponentProps {
  component: EmailComponent;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  propertyData: LandivoProperty | null;
}

function SortableComponent({
  component,
  isSelected,
  onSelect,
  onRemove,
  propertyData
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
    opacity: isDragging ? 0.5 : 1,
  };

  const definition = componentDefinitions.find(def => def.type === component.type);

  // Get icon for component type
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'header': return <Home className="h-4 w-4" />;
      case 'property-image': return <Home className="h-4 w-4" />;
      case 'property-highlights': return <Eye className="h-4 w-4" />;
      case 'property-details': return <FileText className="h-4 w-4" />;
      case 'payment-calculator': return <Calculator className="h-4 w-4" />;
      case 'buyer-guidelines': return <Info className="h-4 w-4" />;
      case 'footer': return <Mail className="h-4 w-4" />;
      case 'spacer': return <Minus className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  // Render component preview with real data
  const renderComponentPreview = () => {
    const props = { ...component.props, ...propertyData };

    switch (component.type) {
      case 'header':
        return (
          <div
            className="p-6 text-center"
            style={{
              backgroundColor: props.backgroundColor || '#f8f9fa',
              backgroundImage: props.imageUrl || propertyData?.primaryImageUrl
                ? `url(${props.imageUrl || propertyData?.primaryImageUrl})`
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: props.imageUrl || propertyData?.primaryImageUrl ? 'white' : 'inherit',
              textShadow: props.imageUrl || propertyData?.primaryImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
            }}
          >
            <h1 className="text-2xl font-bold mb-2">
              {props.title || propertyData?.title || 'Your Property Title'}
            </h1>
            <p className="text-base opacity-90">
              {props.subtitle || `${propertyData?.city || 'Location'}, ${propertyData?.state || 'State'}`}
            </p>
          </div>
        );


      case 'property-image':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <div className="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">
              Property Image ({availableImages?.length || 0} images)
            </p>
            {props.showCaption && (
              <p className="text-xs text-gray-500 mt-1">
                {props.captionText || propertyData?.title || 'Property Caption'}
              </p>
            )}
          </div>
        );

      case 'property-highlights':
        return (
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Size:</strong> {propertyData?.sqft?.toLocaleString() || '21,154'} sqft ({propertyData?.acre || '0.5'} acres)
              </div>
              <div>
                <strong>Price:</strong> ${propertyData?.askingPrice?.toLocaleString() || '45,000'}
              </div>
              <div>
                <strong>Zoning:</strong> {propertyData?.zoning || 'Residential'}
              </div>
              <div>
                <strong>Financing:</strong> {propertyData?.financing || 'Available'}
              </div>
            </div>
          </div>
        );

      case 'property-details':
        return (
          <div className="p-6">
            <h3 className="font-semibold mb-3">Property Details</h3>
            <div className="text-sm space-y-2">
              <p><strong>Address:</strong> {propertyData?.streetAddress || '123 Property Lane'}</p>
              <p><strong>Location:</strong> {propertyData?.city || 'Austin'}, {propertyData?.state || 'TX'} {propertyData?.zip || '78701'}</p>
              <p><strong>County:</strong> {propertyData?.county || 'Travis'}</p>
              <div className="mt-3">
                <p className="text-gray-600">
                  {propertyData?.description || 'Beautiful property with great potential for development or investment.'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'payment-calculator':
        return (
          <div className="p-6 bg-blue-50">
            <h3 className="font-semibold mb-3">Payment Calculator</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <strong>Monthly Payment:</strong><br />
                ${propertyData?.monthlyPaymentOne?.toLocaleString() || '299'}
              </div>
              <div>
                <strong>Down Payment:</strong><br />
                ${propertyData?.downPaymentOne?.toLocaleString() || '10,000'}
              </div>
              <div>
                <strong>Loan Amount:</strong><br />
                ${propertyData?.loanAmountOne?.toLocaleString() || '35,000'}
              </div>
              <div>
                <strong>Interest Rate:</strong><br />
                {propertyData?.interestOne || '9.5'}%
              </div>
            </div>
          </div>
        );

      case 'buyer-guidelines':
        return (
          <div className="p-6 bg-green-50">
            <h3 className="font-semibold mb-3">Buyer Guidelines</h3>
            <div className="text-sm space-y-2">
              <p>• Properties are sold as-is</p>
              <p>• Financing options available</p>
              <p>• Contact us for viewing arrangements</p>
              <p>• Due diligence recommended</p>
            </div>
          </div>
        );

      case 'footer':
        return (
          <div className="p-6 bg-gray-800 text-white text-center">
            <div className="text-sm">
              <p className="font-semibold mb-2">Landivo Real Estate</p>
              <p>Contact us: info@landivo.com | (555) 123-4567</p>
              <p className="mt-2 text-xs opacity-75">
                To unsubscribe, click here
              </p>
            </div>
          </div>
        );

      case 'spacer':
        return (
          <div
            style={{
              height: props.height || 20,
              backgroundColor: props.backgroundColor || 'transparent',
              borderTop: '1px dashed #ddd',
              borderBottom: '1px dashed #ddd'
            }}
            className="flex items-center justify-center text-xs text-gray-400"
          >
            Spacer ({props.height || 20}px)
          </div>
        );

      case 'text':
        return (
          <div
            className="p-6"
            style={{ backgroundColor: props.backgroundColor }}
          >
            <div
              style={{
                textAlign: props.textAlign || 'left',
                fontSize: (props.fontSize || 14) + 'px',
                color: props.color || '#000000',
                lineHeight: '1.5'
              }}
              dangerouslySetInnerHTML={{
                __html: props.content || 'Add your text content here...'
              }}
            />
          </div>
        );

      default:
        return (
          <div className="p-6 text-center text-gray-500">
            <Settings className="h-8 w-8 mx-auto mb-2" />
            <p>Unknown Component</p>
            <p className="text-xs">{component.type}</p>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <Card
        className={`cursor-pointer transition-all duration-200 ${isSelected
          ? 'border-blue-500 shadow-md'
          : 'hover:border-gray-400 hover:shadow-sm'
          }`}
        onClick={onSelect}
      >
        {/* Component Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200"
            >
              <GripVertical className="h-4 w-4 text-gray-500" />
            </div>

            {getComponentIcon(component.type)}

            <div>
              <span className="text-sm font-medium">
                {definition?.name || component.type}
              </span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {component.type}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {component.props?.visible !== false && (
              <Eye className="h-3 w-3 text-green-600" />
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Component Preview */}
        <div className="border-2 border-dashed border-transparent">
          {renderComponentPreview()}
        </div>
      </Card>
    </div>
  );
}

function DroppableCanvas({ children, isEmpty }: { children: React.ReactNode; isEmpty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  if (isEmpty) {
    return (
      <div
        ref={setNodeRef}
        className={`flex-1 flex items-center justify-center bg-gray-50 min-h-96 border-2 border-dashed transition-colors ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
          }`}
      >
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
            <Plus className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start Building Your Template
          </h3>
          <p className="text-gray-600 mb-4 max-w-sm">
            Drag components from the left panel to create your email template.
          </p>
          <div className="flex flex-col gap-2 text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-blue-100 border-2 border-dashed border-blue-300 rounded"></div>
              <span>Drop components here</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} className="flex-1 h-full">
      {children}
    </div>
  );
}

export function CanvasArea({
  template,
  selectedComponent,
  onSelectComponent,
  onRemoveComponent,
  onUpdateComponent,
  propertyData
}: CanvasAreaProps) {
  const isEmpty = template.components.length === 0;

  return (
    <div className="flex-1 h-full bg-gray-50">
      <DroppableCanvas isEmpty={isEmpty}>
        {!isEmpty && (
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4">
              {/* Template Header Info */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{template.name}</h2>
                    <p className="text-sm text-gray-600">{template.components.length} components</p>
                  </div>
                  {propertyData && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-700">
                        Using Real Property Data
                      </p>
                      <p className="text-xs text-green-600">
                        {propertyData.title} • {propertyData.city}, {propertyData.state}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Preview Container */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                <div className="bg-gray-100 px-4 py-2 border-b">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>Email Preview</span>
                    <Badge variant="outline" className="text-xs">
                      {template.components.length} components
                    </Badge>
                  </div>
                </div>

                <div className="max-w-2xl mx-auto">
                  {template.components
                    .sort((a, b) => a.order - b.order)
                    .map((component) => (
                      <SortableComponent
                        key={component.id}
                        component={component}
                        isSelected={selectedComponent?.id === component.id}
                        onSelect={() => onSelectComponent(component)}
                        onRemove={() => onRemoveComponent(component.id)}
                        propertyData={propertyData}
                      />
                    ))}
                </div>
              </div>

              {/* Add Component Hint */}
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                  <Settings className="h-4 w-4" />
                  <span>Drag more components from the left panel to continue building</span>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </DroppableCanvas>
    </div>
  );
}