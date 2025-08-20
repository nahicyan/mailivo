// app/src/app/dashboard/landivo/campaigns/create-multi/components/Step1Property.tsx
'use client';

import React, { useState, useMemo} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, BarChart3 } from 'lucide-react';
import { PropertiesDataTable } from './PropertiesDataTable';
import { PropertiesTableFilter } from './PropertiesTableFilter';

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
  errors: Record<string, string>;
  properties: Property[];
  propertiesLoading: boolean;
  propertiesError: any;
  onSortOrderChange?: (sortedIds: string[]) => void;
}

export function Step1Property({ 
  formData, 
  setFormData, 
  errors, 
  properties = [], 
  propertiesLoading, 
  propertiesError,
  onSortOrderChange
}: Props) {
  // Selection state
  const [selectedProperties, setSelectedProperties] = useState<string[]>(
    formData.selectedProperties || []
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
    { id: "sqft", name: "Square Feet", accessor: "sqft" },
    { id: "acre", name: "Acres", accessor: "acre" },
    { id: "minPrice", name: "Min Price", accessor: "minPrice" },
    { id: "financing", name: "Financing", accessor: "financing" },
    { id: "water", name: "Water", accessor: "water" },
    { id: "sewer", name: "Sewer", accessor: "sewer" },
    { id: "electric", name: "Electric", accessor: "electric" },
    { id: "roadCondition", name: "Road Condition", accessor: "roadCondition" },
    { id: "floodplain", name: "Floodplain", accessor: "floodplain" },
    { id: "zoning", name: "Zoning", accessor: "zoning" },
    { id: "restrictions", name: "Restrictions", accessor: "restrictions" },
    { id: "mobileHomeFriendly", name: "Mobile Home Friendly", accessor: "mobileHomeFriendly" },
    { id: "hoaPoa", name: "HOA/POA", accessor: "hoaPoa" },
    { id: "hoaFee", name: "HOA Fee", accessor: "hoaFee" },
    { id: "notes", name: "Notes", accessor: "notes", isRichText: true },
    { id: "createdAt", name: "Created At", accessor: "createdAt" },
    { id: "updatedAt", name: "Updated At", accessor: "updatedAt" }
  ];

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    if (!properties) return [];
    
    return properties.filter((property) => {
      // Search query filtering
      const searchFields = [
        property.title,
        property.streetAddress,
        property.state,
        property.zip,
        property.area,
        property.apnOrPin,
        property.city,
        property.county
      ].filter(Boolean);
      
      const matchesSearch = searchQuery === "" || 
        searchFields.some(field => 
          field?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Status filter
      const matchesStatus = filters.status === 'all' || property.status === filters.status;
      
      // Area filter
      const matchesArea = filters.area === 'all' || property.area === filters.area;
      
      // Financing filter
      const matchesFinancing = filters.financing === 'all' || property.financing === filters.financing;
      
      // Featured filter
      const matchesFeatured = filters.featured === 'all' || 
        (filters.featured === 'featured' && (property.featured === 'Featured' || property.featured === 'Yes')) ||
        (filters.featured === 'not-featured' && (property.featured !== 'Featured' && property.featured !== 'Yes'));
      
      // Price range filter
      const price = property.askingPrice || 0;
      const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
      
      // Square feet filter
      const sqft = property.sqft || 0;
      const matchesSqft = sqft >= filters.squareFeet[0] && sqft <= filters.squareFeet[1];

      return matchesSearch && matchesStatus && matchesArea && 
             matchesFinancing && matchesFeatured && matchesPrice && matchesSqft;
    });
  }, [properties, searchQuery, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!filteredData.length) return {
      totalProperties: 0,
      selectedCount: 0,
      availableProperties: 0
    };

    const availableCount = filteredData.filter(p => p.status === 'Available').length;

    return {
      totalProperties: filteredData.length,
      selectedCount: selectedProperties.length,
      availableProperties: availableCount
    };
  }, [filteredData, selectedProperties]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredData.map(p => p.id);
      setSelectedProperties(allIds);
      setFormData(prev => ({
        ...prev,
        selectedProperties: allIds
      }));
    } else {
      setSelectedProperties([]);
      setFormData(prev => ({
        ...prev,
        selectedProperties: []
      }));
    }
  };

  const handleSelectProperty = (propertyId: string, checked: boolean) => {
    let newSelected: string[];
    
    if (checked) {
      newSelected = [...selectedProperties, propertyId];
    } else {
      newSelected = selectedProperties.filter(id => id !== propertyId);
    }
    
    setSelectedProperties(newSelected);
    setFormData(prev => ({
      ...prev,
      selectedProperties: newSelected
    }));
  };

  // Handle sort order change from table
  const handleSortOrderChange = (sortedData: Property[]) => {
    // Extract only selected property IDs in their sorted order
    const selectedInSortedOrder = sortedData
      .filter(property => selectedProperties.includes(property.id))
      .map(property => property.id);
    
    // Call parent callback if provided
    if (onSortOrderChange && selectedInSortedOrder.length > 0) {
      onSortOrderChange(selectedInSortedOrder);
    }
  };

  // Clear filters
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
    setSearchQuery("");
  };

  // Format number helper
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (propertiesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <Building className="h-5 w-5" />
            <span>Error Loading Properties</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">
            Failed to load properties. Please try again.
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
            <Building className="h-5 w-5" />
            <span>Select Properties for Campaign</span>
          </CardTitle>
          <div className="text-sm text-gray-600">
            Choose multiple properties to include in your campaign. The order will be preserved based on table sorting.
          </div>
        </CardHeader>
      </Card>

      {/* Selection Summary */}
      {selectedProperties.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedProperties.length} properties selected
                </Badge>
                <span className="text-sm text-gray-600">
                  {stats.availableProperties} available • {stats.totalProperties} total
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSelectAll(false)}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Filters */}
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

      {/* Properties Table */}
      <PropertiesDataTable
        data={filteredData}
        visibleColumns={visibleColumns}
        availableColumns={availableColumns}
        selectedProperties={selectedProperties}
        onSelectAll={handleSelectAll}
        onSelectProperty={handleSelectProperty}
        onSortOrderChange={handleSortOrderChange}
        loading={propertiesLoading}
      />

      {/* Validation Error */}
      {errors.selectedProperties && (
        <div className="text-red-600 text-sm">
          {errors.selectedProperties}
        </div>
      )}
    </div>
  );
}