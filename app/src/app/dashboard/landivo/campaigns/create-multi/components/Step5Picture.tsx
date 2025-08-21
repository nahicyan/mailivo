// app/src/app/dashboard/landivo/campaigns/create-multi/components/Step5Picture.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, ImageIcon, AlertTriangle, MapPin } from 'lucide-react';

// Type definitions
interface Property {
  id: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  imageUrls?: string | string[];
}

interface PropertyImageSelection {
  propertyId: string;
  imageIndex: number;
  imageUrl: string;
}

interface Props {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  errors: Record<string, string>;
  selectedTemplate?: any;
  properties?: Property[];
}

// Utility functions
const parsePropertyImages = (imageUrls: string | string[] | undefined): string[] => {
  if (!imageUrls) return [];
  if (Array.isArray(imageUrls)) return imageUrls;
  
  try {
    return JSON.parse(imageUrls);
  } catch {
    return [];
  }
};

const getFullImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith('http')) return imagePath;
  return `https://api.landivo.com/${imagePath}`;
};

const getPropertyDisplayAddress = (property: Property): string => {
  return `${property.streetAddress}, ${property.city}, ${property.state} ${property.zip}`;
};

// Sub-components
const PropertyImageCard: React.FC<{
  property: Property;
  imageSelection: PropertyImageSelection | undefined;
  onSelectionChange: (propertyId: string, imageIndex: number) => void;
}> = ({ property, imageSelection, onSelectionChange }) => {
  const availableImages = parsePropertyImages(property.imageUrls);
  const selectedIndex = imageSelection?.imageIndex ?? 0;
  const currentImageUrl = availableImages[selectedIndex] 
    ? getFullImageUrl(availableImages[selectedIndex])
    : null;

  const handleImageChange = (value: string) => {
    const imageIndex = parseInt(value, 10);
    onSelectionChange(property.id, imageIndex);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-start space-x-2">
          <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
          <span className="line-clamp-2">{getPropertyDisplayAddress(property)}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Image Selector */}
        {availableImages.length > 0 ? (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-600">
              Select Image ({availableImages.length} available)
            </Label>
            <Select 
              value={selectedIndex.toString()} 
              onValueChange={handleImageChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableImages.map((_, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    Image {index + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              No images available for this property
            </AlertDescription>
          </Alert>
        )}

        {/* Image Preview */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600">Preview</Label>
          <div className="aspect-[4/3] border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={`${property.streetAddress} - Image ${selectedIndex + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY5NzU4NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4K';
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-xs">No image available</p>
                </div>
              </div>
            )}
          </div>
          {currentImageUrl && (
            <p className="text-xs text-gray-500 text-center">
              Image {selectedIndex + 1} of {availableImages.length}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ImageSelectionSummary: React.FC<{
  selections: PropertyImageSelection[];
  properties: Property[];
}> = ({ selections, properties }) => {
  if (selections.length === 0) return null;

  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-green-800 flex items-center space-x-2">
          <Camera className="h-4 w-4" />
          <span>Image Selections Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {selections.map((selection) => {
            const property = properties.find(p => p.id === selection.propertyId);
            if (!property) return null;
            
            return (
              <div key={selection.propertyId} className="flex justify-between items-center text-xs text-green-700">
                <span className="truncate flex-1 mr-2">
                  {property.streetAddress}, {property.city}
                </span>
                <Badge variant="outline" className="text-xs">
                  Image {selection.imageIndex + 1}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Main component
export function Step5Picture({ 
  formData, 
  setFormData, 
  errors, 
  selectedTemplate,
  properties = []
}: Props) {
  // Get selected properties data
  const selectedPropertiesData = useMemo(() => {
    if (!properties?.length || !formData.selectedProperties?.length) return [];
    
    // Use sorted order if available, otherwise use selection order
    const orderToUse = formData.sortedPropertyOrder?.length > 0
      ? formData.sortedPropertyOrder
      : formData.selectedProperties;

    return orderToUse
      .map((id: string) => properties.find(p => p.id === id))
      .filter(Boolean) as Property[];
  }, [properties, formData.selectedProperties, formData.sortedPropertyOrder]);

  // Initialize and manage image selections
  const [imageSelections, setImageSelections] = useState<PropertyImageSelection[]>(
    formData.multiPropertyImageSelections || []
  );

  // Initialize default selections for properties without selections
  useEffect(() => {
    const needsInitialization = selectedPropertiesData.filter(property => 
      !imageSelections.find(selection => selection.propertyId === property.id)
    );

    if (needsInitialization.length > 0) {
      const newSelections = needsInitialization.map(property => {
        const availableImages = parsePropertyImages(property.imageUrls);
        return {
          propertyId: property.id,
          imageIndex: 0,
          imageUrl: availableImages[0] ? getFullImageUrl(availableImages[0]) : ''
        };
      });

      setImageSelections(prev => [...prev, ...newSelections]);
    }
  }, [selectedPropertiesData]);

  // Clean up selections for deselected properties
  useEffect(() => {
    const selectedPropertyIds = selectedPropertiesData.map(p => p.id);
    setImageSelections(prev => 
      prev.filter(selection => selectedPropertyIds.includes(selection.propertyId))
    );
  }, [selectedPropertiesData]);

  // Update form data when selections change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      multiPropertyImageSelections: imageSelections
    }));
  }, [imageSelections, setFormData]);

  const handleSelectionChange = (propertyId: string, imageIndex: number) => {
    const property = selectedPropertiesData.find(p => p.id === propertyId);
    if (!property) return;

    const availableImages = parsePropertyImages(property.imageUrls);
    const imageUrl = availableImages[imageIndex] ? getFullImageUrl(availableImages[imageIndex]) : '';

    setImageSelections(prev => {
      const existing = prev.find(s => s.propertyId === propertyId);
      if (existing) {
        return prev.map(s => 
          s.propertyId === propertyId 
            ? { ...s, imageIndex, imageUrl }
            : s
        );
      } else {
        return [...prev, { propertyId, imageIndex, imageUrl }];
      }
    });
  };

  // Error handling
  if (!selectedPropertiesData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            <span>No Properties Selected</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Please select properties in Step 1 before configuring images.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Configure Property Images</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Select the primary image for each property that will be used in your campaign email.
          </p>
        </CardHeader>
      </Card>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedPropertiesData.map((property) => {
          const selection = imageSelections.find(s => s.propertyId === property.id);
          return (
            <PropertyImageCard
              key={property.id}
              property={property}
              imageSelection={selection}
              onSelectionChange={handleSelectionChange}
            />
          );
        })}
      </div>

      {/* Summary */}
      <ImageSelectionSummary 
        selections={imageSelections}
        properties={selectedPropertiesData}
      />

      {/* Error Display */}
      {errors.multiPropertyImages && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errors.multiPropertyImages}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}