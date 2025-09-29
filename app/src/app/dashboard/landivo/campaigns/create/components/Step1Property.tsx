// app/src/app/dashboard/landivo/campaigns/create/components/Step1Property.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, BarChart3 } from 'lucide-react';
import { PropertiesDataTable } from '../../create-multi/components/PropertiesDataTable';
import { PropertiesTableFilter } from '../../create-multi/components/PropertiesTableFilter';

interface Property {
  id: string;
  streetAddress: string;
  title: string;
  status: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  area: string;
  askingPrice: number;
  sqft: number;
  acre: number;
  featured: string;
  ownerId: string;
  apnOrPin: string;
  latitude: number;
  longitude: number;
  minPrice: number;
  financing: string;
  water: string;
  sewer: string;
  electric: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  handlePropertyChange: (propertyId: string) => void;
  errors: Record<string, string>;
  properties: Property[];
  propertiesLoading: boolean;
  propertiesError: any;
}

export function Step1Property({ 
  formData, 
  setFormData, 
  handlePropertyChange,
  errors, 
  properties = [], 
  propertiesLoading, 
  propertiesError 
}: Props) {
  // Selection state - single property stored as array for compatibility
  const [selectedProperties, setSelectedProperties] = useState<string[]>(
    formData.property ? [formData.property] : []
  );
  
  // Table state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: 'all',
    area: 'all',
    financing: 'all',
    featured: 'all',
    priceRange: [0, 10000000],
    squareFeet: [0, 500000],
    minPriceDisplay: '$0',
    maxPriceDisplay: '$10,000,000',
    minSqftDisplay: '0',
    maxSqftDisplay: '50,000'
  });
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState([
    'streetAddress',
    'title',
    'status',
    'location',
    'askingPrice',
    'area',
    'featured'
  ]);

  // Available columns configuration
  const availableColumns = [
    { id: "streetAddress", name: "Street Address", accessor: "streetAddress" },
    { id: "title", name: "Title", accessor: "title", isRichText: true },
    { id: "status", name: "Status", accessor: "status" },
    { id: "location", name: "Location", accessor: (row: Property) => `${row.city}, ${row.state}` },
    { id: "askingPrice", name: "Asking Price", accessor: "askingPrice" },
    { id: "area", name: "Area", accessor: "area" },
    { id: "ownerId", name: "Owner ID", accessor: "ownerId" },
    { id: "featured", name: "Featured", accessor: "featured" },
    { id: "description", name: "Description", accessor: "description", isRichText: true },
    { id: "city", name: "City", accessor: "city" },
    { id: "county", name: "County", accessor: "county" },
    { id: "state", name: "State", accessor: "state" },
    { id: "zip", name: "ZIP", accessor: "zip" },
    { id: "apnOrPin", name: "APN/PIN", accessor: "apnOrPin" },
    { id: "latitude", name: "Latitude", accessor: "latitude" },
    { id: "longitude", name: "Longitude", accessor: "longitude" },
    { id: "minPrice", name: "Min Price", accessor: "minPrice" },
    { id: "financing", name: "Financing", accessor: "financing" },
    { id: "water", name: "Water", accessor: "water" },
    { id: "sewer", name: "Sewer", accessor: "sewer" },
    { id: "electric", name: "Electric", accessor: "electric" },
    { id: "sqft", name: "Sq Ft", accessor: "sqft" },
    { id: "acre", name: "Acres", accessor: "acre" }
  ];

  // Filter and search properties
  const filteredProperties = useMemo(() => {
    if (!properties || properties.length === 0) return [];

    let filtered = [...properties];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.streetAddress?.toLowerCase().includes(query) ||
        property.title?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.state?.toLowerCase().includes(query) ||
        property.zip?.toLowerCase().includes(query) ||
        property.area?.toLowerCase().includes(query) ||
        property.county?.toLowerCase().includes(query) ||
        property.apnOrPin?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.area !== 'all') {
      filtered = filtered.filter(p => p.area === filters.area);
    }
    if (filters.financing !== 'all') {
      filtered = filtered.filter(p => p.financing === filters.financing);
    }
    if (filters.featured !== 'all') {
      filtered = filtered.filter(p => p.featured === filters.featured);
    }

    // Price range filter
    filtered = filtered.filter(p => 
      p.askingPrice >= filters.priceRange[0] && 
      p.askingPrice <= filters.priceRange[1]
    );

    // Square footage filter
    filtered = filtered.filter(p => 
      p.sqft >= filters.squareFeet[0] && 
      p.sqft <= filters.squareFeet[1]
    );

    return filtered;
  }, [properties, searchQuery, filters]);

  // Handle property selection - SINGLE SELECTION ONLY
  const handleSelectProperty = (propertyId: string, checked: boolean) => {
    if (checked) {
      // Select only this property
      setSelectedProperties([propertyId]);
      handlePropertyChange(propertyId);
    } else {
      // Deselect
      setSelectedProperties([]);
      handlePropertyChange('');
    }
  };

  // Handle "select all" - for single property, selects first property
  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredProperties.length > 0) {
      const firstPropertyId = filteredProperties[0].id;
      setSelectedProperties([firstPropertyId]);
      handlePropertyChange(firstPropertyId);
    } else {
      setSelectedProperties([]);
      handlePropertyChange('');
    }
  };

  // Sync with formData
  useEffect(() => {
    if (formData.property) {
      setSelectedProperties([formData.property]);
    } else {
      setSelectedProperties([]);
    }
  }, [formData.property]);

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      status: 'all',
      area: 'all',
      financing: 'all',
      featured: 'all',
      priceRange: [0, 10000000],
      squareFeet: [0, 500000],
      minPriceDisplay: '$0',
      maxPriceDisplay: '$10,000,000',
      minSqftDisplay: '0',
      maxSqftDisplay: '50,000'
    });
    setSearchQuery('');
  };

  // Format number helper
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num}`;
  };

  // Get selected property data
  const selectedPropertyData = useMemo(() => {
    if (selectedProperties.length === 0) return null;
    return properties?.find(p => p.id === selectedProperties[0]);
  }, [selectedProperties, properties]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Select Property</span>
          </CardTitle>
          {selectedPropertyData && (
            <Badge variant="default" className="ml-auto">
              <BarChart3 className="h-3 w-3 mr-1" />
              1 Property Selected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Display */}
        {propertiesError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              Error loading properties: {propertiesError.message || 'Unknown error'}
            </p>
          </div>
        )}

        {errors.property && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.property}</p>
          </div>
        )}

        {/* Selected Property Info */}
        {selectedPropertyData && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-blue-900">
                  {selectedPropertyData.streetAddress}
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  {selectedPropertyData.city}, {selectedPropertyData.state} {selectedPropertyData.zip}
                </p>
                {selectedPropertyData.title && (
                  <p className="text-sm text-blue-600 mt-2">
                    {selectedPropertyData.title}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {selectedPropertyData.status}
              </Badge>
            </div>
          </div>
        )}

        {/* Table Filter Controls */}
        <PropertiesTableFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          setFilters={setFilters}
          clearAllFilters={clearAllFilters}
          formatNumber={formatNumber}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          availableColumns={availableColumns}
        />

        {/* Properties Data Table */}
        <PropertiesDataTable
          data={filteredProperties}
          visibleColumns={visibleColumns}
          availableColumns={availableColumns}
          selectedProperties={selectedProperties}
          onSelectAll={handleSelectAll}
          onSelectProperty={handleSelectProperty}
          loading={propertiesLoading}
        />

        {/* Help Text */}
        <div className="text-sm text-gray-500 italic">
          * Select one property from the table above. Use filters and search to find the property you want to feature in your campaign.
        </div>
      </CardContent>
    </Card>
  );
}