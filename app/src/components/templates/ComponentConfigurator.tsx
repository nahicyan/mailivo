// app/src/components/templates/ComponentConfigurator.tsx
import React from 'react';
import { useMemo } from 'react';
import { EmailComponent, ComponentConfigField, EmailTemplate } from '@/types/template';
import { componentDefinitions } from '@/data/componentDefinitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Settings } from 'lucide-react';
import { LandivoProperty } from '@/types/landivo';

interface ComponentConfiguratorProps {
  component: EmailComponent | null;
  onUpdate: (componentId: string, updates: Partial<EmailComponent>) => void;
  template: EmailTemplate;
  onUpdateTemplate: (template: EmailTemplate) => void;
  propertyData?: LandivoProperty | null;
}

export function ComponentConfigurator({
  component,
  onUpdate,
  template,
  onUpdateTemplate,
  propertyData,
}: ComponentConfiguratorProps) {
  // Handle case where no component is selected
  if (!component) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Template Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Component Selected
              </h3>
              <p className="text-gray-600 text-sm">
                Select a component from the canvas to configure its settings
              </p>
            </div>

            {/* Template Global Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-gray-900">Template Settings</h4>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={template.settings?.backgroundColor || '#f9fafb'}
                    onChange={(e) => onUpdateTemplate({
                      ...template,
                      settings: {
                        ...template.settings,
                        backgroundColor: e.target.value
                      }
                    })}
                    className="w-16 h-9 p-1"
                  />
                  <Input
                    value={template.settings?.backgroundColor || '#f9fafb'}
                    onChange={(e) => onUpdateTemplate({
                      ...template,
                      settings: {
                        ...template.settings,
                        backgroundColor: e.target.value
                      }
                    })}
                    placeholder="#f9fafb"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={template.settings?.primaryColor || '#16a34a'}
                    onChange={(e) => onUpdateTemplate({
                      ...template,
                      settings: {
                        ...template.settings,
                        primaryColor: e.target.value
                      }
                    })}
                    className="w-16 h-9 p-1"
                  />
                  <Input
                    value={template.settings?.primaryColor || '#16a34a'}
                    onChange={(e) => onUpdateTemplate({
                      ...template,
                      settings: {
                        ...template.settings,
                        primaryColor: e.target.value
                      }
                    })}
                    placeholder="#16a34a"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Family</Label>
                <Select
                  value={template.settings?.fontFamily || 'Arial, sans-serif'}
                  onValueChange={(val) => onUpdateTemplate({
                    ...template,
                    settings: {
                      ...template.settings,
                      fontFamily: val
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                    <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find component definition - with null check
  const definition = componentDefinitions.find(def => def.type === component.type);
  if (!definition) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Unknown Component
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">
              Component type "{component.type}" not found
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getValue = (key: string): any => {
    const keys = key.split('.');
    let value = component.props;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  };

  const getStringValue = (key: string): string => {
    const value = getValue(key);
    return typeof value === 'string' ? value : '';
  };

  const getNumberValue = (key: string): number => {
    const value = getValue(key);
    return typeof value === 'number' ? value : 0;
  };

  const getBooleanValue = (key: string): boolean => {
    const value = getValue(key);
    return Boolean(value);
  };

  const getArrayValue = (key: string): any[] => {
    const value = getValue(key);
    return Array.isArray(value) ? value : [];
  };

  const setValue = (key: string, value: any) => {
    const keys = key.split('.');
    const newProps = { ...component.props };
    let current = newProps;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;

    // Update the component using the onUpdate callback
    onUpdate(component.id, { props: newProps });
  };

  const renderField = (field: ComponentConfigField) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={getStringValue(field.key)}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={getStringValue(field.key)}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={getNumberValue(field.key)}
            onChange={(e) => setValue(field.key, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
          />
        );

      case 'color':
        const colorValue = getStringValue(field.key) || '#000000';
        return (
          <div className="flex gap-2">
            <Input
              type="color"
              value={colorValue}
              onChange={(e) => setValue(field.key, e.target.value)}
              className="w-16 h-9 p-1"
            />
            <Input
              value={colorValue}
              onChange={(e) => setValue(field.key, e.target.value)}
              placeholder="#000000"
            />
          </div>
        );

      case 'boolean':
        return (
          <Switch
            checked={getBooleanValue(field.key)}
            onCheckedChange={(checked) => setValue(field.key, checked)}
          />
        );

      case 'select':
        return (
          <Select
            value={getStringValue(field.key)}
            onValueChange={(val) => setValue(field.key, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'array':
        return (
          <ArrayField
            field={field}
            value={getArrayValue(field.key)}
            setValue={setValue}
          />
        );

      default:
        return null;
    }
  };
  // Special handling for property-image component
  if (component.type === 'property-image') {
    const availableImages = useMemo(() => {
      if (!propertyData?.imageUrls) return [];
      try {
        return Array.isArray(propertyData.imageUrls)
          ? propertyData.imageUrls
          : JSON.parse(propertyData.imageUrls);
      } catch {
        return [];
      }
    }, [propertyData?.imageUrls]);
    console.log('PropertyData in ComponentConfigurator:', propertyData);
    console.log('ImageUrls:', propertyData?.imageUrls);

    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              🖼️ Property Image
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {/* Image Selection Dropdown */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Image</Label>
                <Select
                  value={component.props.selectedImageIndex?.toString() || '0'}
                  onValueChange={(value) => setValue('selectedImageIndex', parseInt(value))}
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
                <p className="text-xs text-gray-500">
                  {availableImages.length} images available
                </p>
              </div>

              {/* Image Preview */}
              {availableImages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={`https://api.landivo.com/${availableImages[component.props.selectedImageIndex || 0]}`}
                      alt="Selected property image"
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjk3NTg2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPgo=';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Render other standard fields */}
              {definition.configFields?.filter(field => field.key !== 'selectedImageIndex').map(field => (
                <div key={field.key} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {definition.icon && <span>{definition.icon}</span>}
            {definition.name}
          </CardTitle>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onUpdate(component.id, { _delete: true })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {definition.configFields?.map(field => (
              <div key={field.key} className="space-y-2">
                <Label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
                {field.description && (
                  <p className="text-xs text-gray-500">{field.description}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ArrayField({ field, value, setValue }: {
  field: ComponentConfigField;
  value: any[];
  setValue: (key: string, value: any) => void;
}) {
  const addItem = () => {
    const newItem = field.key.includes('highlights')
      ? { icon: '📏', value: 'New Value', label: 'Label' }
      : field.key.includes('details')
        ? { label: 'Detail', value: 'Value' }
        : 'New Item';

    setValue(field.key, [...value, newItem]);
  };

  const removeItem = (index: number) => {
    setValue(field.key, value.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updates: any) => {
    const newValue = [...value];
    newValue[index] = typeof newValue[index] === 'object'
      ? { ...newValue[index], ...updates }
      : updates;
    setValue(field.key, newValue);
  };

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex gap-2 items-center p-2 border rounded">
          {typeof item === 'object' ? (
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Input
                placeholder="Label"
                value={item.label || ''}
                onChange={(e) => updateItem(index, { label: e.target.value })}
              />
              <Input
                placeholder="Value"
                value={item.value || ''}
                onChange={(e) => updateItem(index, { value: e.target.value })}
              />
            </div>
          ) : (
            <Input
              className="flex-1"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
            />
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeItem(index)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={addItem}>
        <Plus className="h-3 w-3 mr-1" />
        Add Item
      </Button>
    </div>
  );
}