// app/src/app/dashboard/landivo/campaigns/create-multi/components/PropertiesTableFilter.tsx
'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  SlidersHorizontal, 
  Columns as ColumnsIcon, 
  X,
  Filter
} from 'lucide-react';

interface Column {
  id: string;
  name: string;
  accessor: string | ((row: any) => string);
  isRichText?: boolean;
}

interface Filters {
  status: string;
  area: string;
  financing: string;
  featured: string;
  priceRange: number[];
  squareFeet: number[];
  minPriceDisplay: string;
  maxPriceDisplay: string;
  minSqftDisplay: string;
  maxSqftDisplay: string;
}

interface Props {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: Filters;
  setFilters: (filters: Filters | ((prev: Filters) => Filters)) => void;
  clearAllFilters: () => void;
  formatNumber: (num: number) => string;
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
  availableColumns: Column[];
}

export function PropertiesTableFilter({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  clearAllFilters,
  formatNumber,
  visibleColumns,
  setVisibleColumns,
  availableColumns
}: Props) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Handle filter changes
  const handleFilterChange = (type: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Handle price range changes
  const handlePriceRangeChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: value,
      minPriceDisplay: formatNumber(value[0]),
      maxPriceDisplay: formatNumber(value[1])
    }));
  };

  // Handle square footage range changes
  const handleSqftRangeChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      squareFeet: value,
      minSqftDisplay: formatNumber(value[0]),
      maxSqftDisplay: formatNumber(value[1])
    }));
  };

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'priceRange') return value[0] > 0 || value[1] < 10000000;
    if (key === 'squareFeet') return value[0] > 0 || value[1] < 500000;
    if (key.includes('Display')) return false;
    return value !== 'all';
  }).length;

  return (
    <div className="space-y-4">
      {/* Main Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Search Input */}
        <div className="w-full lg:flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by title, address, state, zip, area, APN, city, or county..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {/* Desktop Column Selector */}
        <div className="hidden lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="border-[#324c48] text-[#324c48] hover:bg-[#324c48] hover:text-white"
              >
                <ColumnsIcon className="h-4 w-4 mr-2" />
                Columns ({visibleColumns.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {availableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={visibleColumns.includes(column.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setVisibleColumns([...visibleColumns, column.id]);
                      } else {
                        setVisibleColumns(
                          visibleColumns.filter((id) => id !== column.id)
                        );
                      }
                    }}
                  >
                    {column.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Advanced Filters */}
        <div className="hidden lg:flex">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="border-[#324c48] text-[#324c48] hover:bg-[#324c48] hover:text-white"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" /> 
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-lg">Filter Properties</h3>
                  {activeFiltersCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="status-filter">Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger id="status-filter">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Sold">Sold</SelectItem>
                        <SelectItem value="Not Available">Not Available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Area Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="area-filter">Area</Label>
                    <Select
                      value={filters.area}
                      onValueChange={(value) => handleFilterChange('area', value)}
                    >
                      <SelectTrigger id="area-filter">
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Areas</SelectItem>
                        <SelectItem value="DFW">DFW</SelectItem>
                        <SelectItem value="Austin">Austin</SelectItem>
                        <SelectItem value="Houston">Houston</SelectItem>
                        <SelectItem value="San Antonio">San Antonio</SelectItem>
                        <SelectItem value="Other Areas">Other Areas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Financing Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="financing-filter">Financing</Label>
                    <Select
                      value={filters.financing}
                      onValueChange={(value) => handleFilterChange('financing', value)}
                    >
                      <SelectTrigger id="financing-filter">
                        <SelectValue placeholder="Select financing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Cash Only">Cash Only</SelectItem>
                        <SelectItem value="Financing Available">Financing Available</SelectItem>
                        <SelectItem value="Owner Financing">Owner Financing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Featured Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="featured-filter">Featured</Label>
                    <Select
                      value={filters.featured}
                      onValueChange={(value) => handleFilterChange('featured', value)}
                    >
                      <SelectTrigger id="featured-filter">
                        <SelectValue placeholder="Select featured" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
                        <SelectItem value="featured">Featured Only</SelectItem>
                        <SelectItem value="not-featured">Not Featured</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <Label>Price Range</Label>
                  <div className="px-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={handlePriceRangeChange}
                      max={10000000}
                      min={0}
                      step={50000}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{filters.minPriceDisplay}</span>
                    <span>{filters.maxPriceDisplay}</span>
                  </div>
                </div>

                {/* Square Footage Range */}
                <div className="space-y-3">
                  <Label>Square Footage</Label>
                  <div className="px-2">
                    <Slider
                      value={filters.squareFeet}
                      onValueChange={handleSqftRangeChange}
                      max={500000}
                      min={0}
                      step={500}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{filters.minSqftDisplay} sqft</span>
                    <span>{filters.maxSqftDisplay} sqft</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile Filters Toggle */}
        <div className="lg:hidden">
          <Button 
            variant="outline"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {showMobileFilters && (
        <div className="lg:hidden border rounded-lg p-4 bg-gray-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Filters</h3>
              {activeFiltersCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600"
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Mobile filter controls - same as desktop but in mobile layout */}
            <div className="grid grid-cols-1 gap-4">
              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Area */}
              <div>
                <Label>Area</Label>
                <Select
                  value={filters.area}
                  onValueChange={(value) => handleFilterChange('area', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    <SelectItem value="DFW">DFW</SelectItem>
                    <SelectItem value="Austin">Austin</SelectItem>
                    <SelectItem value="Houston">Houston</SelectItem>
                    <SelectItem value="San Antonio">San Antonio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(searchQuery || activeFiltersCount > 0) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{searchQuery}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSearchQuery('')}
              />
            </Badge>
          )}

          {Object.entries(filters).map(([key, value]) => {
            if (key.includes('Display') || value === 'all') return null;
            if (key === 'priceRange' && (value[0] === 0 && value[1] === 10000000)) return null;
            if (key === 'squareFeet' && (value[0] === 0 && value[1] === 500000)) return null;

            return (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {key}: {Array.isArray(value) ? `${formatNumber(value[0])}-${formatNumber(value[1])}` : value}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    if (key === 'priceRange') {
                      handleFilterChange(key, [0, 10000000]);
                    } else if (key === 'squareFeet') {
                      handleFilterChange(key, [0, 500000]);
                    } else {
                      handleFilterChange(key as keyof Filters, 'all');
                    }
                  }}
                />
              </Badge>
            );
          })}

          {(searchQuery || activeFiltersCount > 0) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchQuery('');
                clearAllFilters();
              }}
              className="text-red-600 hover:text-red-700"
            >
              Clear All
            </Button>
          )}
        </div>
      )}
    </div>
  );
}