// app/src/components/templates/PropertySelector.tsx
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandivoProperty } from '@/types/landivo';

interface PropertySelectorProps {
  selectedProperty: LandivoProperty | null;
  onPropertySelect: (property: LandivoProperty) => void;
}

export function PropertySelector({ selectedProperty, onPropertySelect }: PropertySelectorProps) {
  const [properties, setProperties] = useState<LandivoProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://api.landivo.com/residency/allresd');
      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.status}`);
      }
      
      const data: LandivoProperty[] = await response.json();
      setProperties(data);
      
      // Auto-select first property if none selected
      if (data.length > 0 && !selectedProperty) {
        onPropertySelect(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const formatPropertyLabel = (property: LandivoProperty) => {
    const address = `${property.streetAddress}, ${property.city}, ${property.state}`;
    const price = property.askingPrice ? `$${property.askingPrice.toLocaleString()}` : '';
    return `${address} ${price ? `(${price})` : ''}`;
  };

  const formatPropertyValue = (property: LandivoProperty) => {
    return property.id || property.title;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading properties...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-red-600">
          <span>Failed to load properties</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchProperties}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">
          Preview Property
        </Label>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {properties.length} available
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchProperties}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <Select
        value={selectedProperty ? formatPropertyValue(selectedProperty) : ''}
        onValueChange={(value) => {
          const property = properties.find(p => 
            (p.id || p.title) === value
          );
          if (property) {
            onPropertySelect(property);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a property for preview">
            {selectedProperty && (
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="truncate">
                  {formatPropertyLabel(selectedProperty)}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {properties.map((property) => (
            <SelectItem 
              key={property.id || property.title} 
              value={formatPropertyValue(property)}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span className="font-medium">{property.title}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {property.streetAddress}, {property.city}, {property.state}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {property.askingPrice && (
                    <Badge variant="outline" className="text-xs">
                      ${property.askingPrice.toLocaleString()}
                    </Badge>
                  )}
                  {property.acre && (
                    <Badge variant="outline" className="text-xs">
                      {property.acre} acres
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {property.status || 'Available'}
                  </Badge>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedProperty && (
        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
          ✓ Using:  {selectedProperty.streetAddress}, {selectedProperty.city}, {selectedProperty.state} for template preview
        </div>
      )}
    </div>
  );
}