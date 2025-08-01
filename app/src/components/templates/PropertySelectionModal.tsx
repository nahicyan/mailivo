// app/src/components/templates/PropertySelectionModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, DollarSign } from 'lucide-react';
import axios from 'axios';

interface Property {
  id: string;
  title: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  askingPrice: number;
  sqft: number;
  acre: number;
  status: string;
  imageUrls: string[];
}

interface PropertySelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectProperty: (property: Property) => void;
  selectedProperty?: Property | null;
}

export function PropertySelectionModal({
  open,
  onClose,
  onSelectProperty,
  selectedProperty
}: PropertySelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await axios.get('https://api.landivo.com/residency/allresd');
      return response.data;
    },
    enabled: open
  });

  const filteredProperties = properties?.filter((property: Property) =>
    property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.streetAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSelectProperty = (property: Property) => {
    onSelectProperty(property);
    onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Property for Template</DialogTitle>
          <DialogDescription>
            Choose a property to populate template data and images
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search properties by title, address, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected Property */}
        {selectedProperty && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-600 mb-1">Currently Selected:</div>
            <div className="font-medium text-blue-900">
              {stripHtml(selectedProperty.title)}
            </div>
            <div className="text-sm text-blue-700">
              {selectedProperty.streetAddress}, {selectedProperty.city}, {selectedProperty.state}
            </div>
          </div>
        )}

        {/* Properties List */}
        <div className="flex-1 overflow-auto space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            filteredProperties.map((property: Property) => (
              <div
                key={property.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedProperty?.id === property.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleSelectProperty(property)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 flex-1 mr-4">
                    {stripHtml(property.title)}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={property.status === 'Available' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {property.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.streetAddress}, {property.city}, {property.state} {property.zip}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-green-600 font-medium">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {formatPrice(property.askingPrice)}
                  </div>
                  <div className="text-gray-500">
                    {property.sqft?.toLocaleString()} sqft • {property.acre} acres
                  </div>
                  <div className="text-gray-500">
                    {property.imageUrls?.length || 0} images
                  </div>
                </div>
              </div>
            ))
          )}

          {!isLoading && filteredProperties.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No properties match your search' : 'No properties available'}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {selectedProperty && (
            <Button
              variant="outline"
              onClick={() => {
                onSelectProperty(null);
                onClose();
              }}
            >
              Clear Selection
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}