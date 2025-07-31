// app/src/components/templates/PropertyPanel.tsx
'use client';

import { useState } from 'react';
import { EmailComponent } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Settings } from 'lucide-react';

interface PropertyPanelProps {
  component: EmailComponent;
  onUpdate: (updates: Partial<EmailComponent>) => void;
  onClose: () => void;
}

export function PropertyPanel({ component, onUpdate, onClose }: PropertyPanelProps) {
  const [localProps, setLocalProps] = useState(component.props || {});

  const handlePropChange = (key: string, value: any) => {
    const newProps = { ...localProps, [key]: value };
    setLocalProps(newProps);
    onUpdate({ props: newProps });
  };

  const renderHeaderProperties = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="className" className="text-sm font-medium">
          CSS Classes
        </Label>
        <Input
          id="className"
          value={localProps.className || ''}
          onChange={(e) => handlePropChange('className', e.target.value)}
          placeholder="Additional CSS classes"
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Add custom Tailwind classes for styling
        </p>
      </div>

      <div>
        <Label htmlFor="showBottomBorder" className="text-sm font-medium">
          Bottom Border
        </Label>
        <Select
          value={localProps.showBottomBorder !== false ? 'true' : 'false'}
          onValueChange={(value) => handlePropChange('showBottomBorder', value === 'true')}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Show</SelectItem>
            <SelectItem value="false">Hide</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Alignment</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {['left', 'center', 'right'].map((align) => (
            <Button
              key={align}
              variant={localProps.textAlign === align ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePropChange('textAlign', align)}
              className="capitalize"
            >
              {align}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderComponentProperties = () => {
    switch (component.type) {
      case 'header':
        return renderHeaderProperties();
      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No properties available for this component</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed bottom-0 right-0 w-80 h-96 bg-white border-l border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium">
            {component.name} Properties
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 overflow-auto h-full pb-16">
        {/* Component Info */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-900">{component.name}</div>
          <div className="text-xs text-gray-600 mt-1">ID: {component.id}</div>
          <div className="text-xs text-gray-600">Type: {component.type}</div>
        </div>

        {/* Component Properties */}
        {renderComponentProperties()}

        {/* Component Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onUpdate({ name: prompt('Enter new name:', component.name) || component.name })}
            >
              Rename Component
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => {
                if (confirm('Delete this component?')) {
                  // Component deletion is handled by parent
                  onClose();
                }
              }}
            >
              Delete Component
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}