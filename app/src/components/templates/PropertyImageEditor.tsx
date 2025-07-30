// app/src/components/templates/PropertyImageEditor.tsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PropertyImageEditorProps {
  component: EmailComponent;
  propertyData: LandivoProperty | null;
  onUpdate: (updates: Partial<EmailComponent>) => void;
}

export function PropertyImageEditor({ component, propertyData, onUpdate }: PropertyImageEditorProps) {
  const availableImages = React.useMemo(() => {
    if (!propertyData?.imageUrls) return [];
    try {
      return Array.isArray(propertyData.imageUrls) 
        ? propertyData.imageUrls 
        : JSON.parse(propertyData.imageUrls);
    } catch {
      return [];
    }
  }, [propertyData?.imageUrls]);

  const handlePropChange = (key: string, value: any) => {
    onUpdate({
      props: {
        ...component.props,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Image</Label>
        <Select
          value={component.props.selectedImageIndex?.toString() || '0'}
          onValueChange={(value) => handlePropChange('selectedImageIndex', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose an image..." />
          </SelectTrigger>
          <SelectContent>
            {availableImages.map((imagePath: string, index: number) => (
              <SelectItem key={index} value={index.toString()}>
                Image {index + 1} - {imagePath.split('/').pop()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          {availableImages.length} images available
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Label>Show Caption</Label>
        <Switch
          checked={component.props.showCaption ?? true}
          onCheckedChange={(checked) => handlePropChange('showCaption', checked)}
        />
      </div>

      <div>
        <Label>Custom Caption</Label>
        <Input
          value={component.props.captionText || ''}
          onChange={(e) => handlePropChange('captionText', e.target.value)}
          placeholder="Leave empty for auto caption"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Link to Property</Label>
        <Switch
          checked={component.props.linkToProperty ?? false}
          onCheckedChange={(checked) => handlePropChange('linkToProperty', checked)}
        />
      </div>

      {component.props.linkToProperty && (
        <div>
          <Label>Property URL</Label>
          <Input
            value={component.props.propertyUrl || ''}
            onChange={(e) => handlePropChange('propertyUrl', e.target.value)}
            placeholder="https://example.com/property/123"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Width</Label>
          <Input
            value={component.props.width || '100%'}
            onChange={(e) => handlePropChange('width', e.target.value)}
            placeholder="100%"
          />
        </div>
        <div>
          <Label>Border Radius</Label>
          <Input
            value={component.props.borderRadius || '8px'}
            onChange={(e) => handlePropChange('borderRadius', e.target.value)}
            placeholder="8px"
          />
        </div>
      </div>
    </div>
  );
}