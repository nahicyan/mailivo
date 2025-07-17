// app/src/components/templates/ComponentConfigurator.tsx
import { useState } from 'react';
import { EmailComponent, ComponentConfigField } from '@/types/template';
import { componentDefinitions } from '@/data/componentDefinitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus } from 'lucide-react';

interface ComponentConfiguratorProps {
  component: EmailComponent;
  onUpdate: (props: Record<string, any>) => void;
  onRemove: () => void;
}

export function ComponentConfigurator({ component, onUpdate, onRemove }: ComponentConfiguratorProps) {
  const definition = componentDefinitions.find(def => def.type === component.type);
  if (!definition) return null;

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
    onUpdate(newProps);
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

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>{component.icon}</span>
            {component.name}
          </CardTitle>
          <Button variant="destructive" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {definition.configFields.map(field => (
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

function ArrayField({ field, value, setValue }: {
  field: ComponentConfigField;
  value: any[];
  setValue: (key: string, value: any) => void;
}) {
  const addItem = () => {
    const newItem = field.key.includes('highlights') 
      ? { icon: '📏', value: 'New Value', label: 'Label' }
      : field.key.includes('Details')
      ? { label: 'Label', value: 'Value' }
      : 'New Item';
    
    setValue(field.key, [...value, newItem]);
  };

  const updateItem = (index: number, newValue: any) => {
    const newArray = [...value];
    newArray[index] = newValue;
    setValue(field.key, newArray);
  };

  const removeItem = (index: number) => {
    setValue(field.key, value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="border rounded p-3 space-y-2">
          {typeof item === 'object' ? (
            <div className="space-y-2">
              {Object.entries(item).map(([key, val]) => (
                <div key={key}>
                  <Label className="text-xs">{key}</Label>
                  <Input
                    value={String(val || '')}
                    onChange={(e) => updateItem(index, { ...item, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Input
              value={String(item || '')}
              onChange={(e) => updateItem(index, e.target.value)}
            />
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => removeItem(index)}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={addItem}>
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
}