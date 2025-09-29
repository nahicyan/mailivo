'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
            <Label className="text-xs font-medium text-gray-700">Select Image</Label>
            <Select value={selectedIndex.toString()} onValueChange={handleImageChange}>
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
          <div className="text-center py-4">
            <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No images available</p>
          </div>
        )}

        {/* Image Preview */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Preview</Label>
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={`Property ${selectedIndex + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-property.jpg';
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No image selected</p>
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
  // Deduplicate selections by propertyId to fix React key errors
  const uniqueSelections = selections.filter((selection, index, array) => 
    array.findIndex(s => s.propertyId === selection.propertyId) === index
  );

  if (uniqueSelections.length === 0) return null;

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
          {uniqueSelections.map((selection) => {
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
export function MultiPictureSelection({ 
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

  // Local state for image selections
  const [imageSelections, setImageSelections] = useState<PropertyImageSelection[]>([]);
  
  // Ref to track if we've initialized selections
  const initializedRef = useRef(false);

  // Initialize selections only once when properties change
  useEffect(() => {
    if (selectedPropertiesData.length === 0) {
      setImageSelections([]);
      initializedRef.current = false;
      return;
    }

    // Only initialize if we haven't already or if properties changed
    const currentPropertyIds = selectedPropertiesData.map(p => p.id).sort().join(',');
    const existingPropertyIds = imageSelections.map(s => s.propertyId).sort().join(',');
    
    if (!initializedRef.current || currentPropertyIds !== existingPropertyIds) {
      // Get existing selections from form data
      const existingFromForm = (formData.multiPropertyImageSelections || [])
        .filter((sel: PropertyImageSelection) => 
          selectedPropertiesData.some(p => p.id === sel.propertyId)
        );

      // Create default selections for properties without existing selections
      const newSelections: PropertyImageSelection[] = [];
      
      selectedPropertiesData.forEach((property) => {
        const existing = existingFromForm.find((sel: PropertyImageSelection) => sel.propertyId === property.id);
        if (existing) {
          newSelections.push(existing);
        } else {
          const availableImages = parsePropertyImages(property.imageUrls);
          newSelections.push({
            propertyId: property.id,
            imageIndex: 0,
            imageUrl: availableImages[0] ? getFullImageUrl(availableImages[0]) : ''
          });
        }
      });

      setImageSelections(newSelections);
      initializedRef.current = true;
    }
  }, [selectedPropertiesData.map(p => p.id).join(',')]); // Only re-run when property IDs change

  // Update form data when selections change (throttled)
  useEffect(() => {
    if (imageSelections.length > 0) {
      setFormData(prev => ({
        ...prev,
        multiPropertyImageSelections: imageSelections
      }));
    }
  }, [imageSelections]); // Remove setFormData from dependencies to prevent infinite loop

  // Handle selection change
  const handleSelectionChange = (propertyId: string, imageIndex: number) => {
    const property = selectedPropertiesData.find(p => p.id === propertyId);
    if (!property) return;

    const availableImages = parsePropertyImages(property.imageUrls);
    const imageUrl = availableImages[imageIndex] ? getFullImageUrl(availableImages[imageIndex]) : '';

    setImageSelections(prev => 
      prev.map(sel => 
        sel.propertyId === propertyId 
          ? { ...sel, imageIndex, imageUrl }
          : sel
      )
    );
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