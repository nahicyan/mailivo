// app/src/app/dashboard/landivo/campaigns/create-multi/components/PropertiesDataTable.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronUp, 
  ChevronDown, 
  Loader2,
  Eye,
  PencilIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

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

interface Column {
  id: string;
  name: string;
  accessor: string | ((row: Property) => string);
  isRichText?: boolean;
}

interface Props {
  data: Property[];
  visibleColumns: string[];
  availableColumns: Column[];
  selectedProperties: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectProperty: (propertyId: string, checked: boolean) => void;
  loading: boolean;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export function PropertiesDataTable({
  data,
  visibleColumns,
  availableColumns,
  selectedProperties,
  onSelectAll,
  onSelectProperty,
  loading
}: Props) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [expandedCells, setExpandedCells] = useState<{[key: string]: boolean}>({});

  // Get visible column configurations
  const displayColumns = useMemo(() => {
    return availableColumns.filter(col => visibleColumns.includes(col.id));
  }, [availableColumns, visibleColumns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = getColumnValue(a, sortConfig.key);
      const bValue = getColumnValue(b, sortConfig.key);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      return 0;
    });
  }, [data, sortConfig]);

  // Get column value for sorting
  const getColumnValue = (row: Property, columnId: string): any => {
    const column = availableColumns.find(col => col.id === columnId);
    if (!column) return '';

    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }

    return row[column.accessor as keyof Property];
  };

  // Handle sorting
  const handleSort = (columnId: string) => {
    setSortConfig(current => {
      if (current?.key === columnId) {
        // Toggle direction or clear sort
        if (current.direction === 'asc') {
          return { key: columnId, direction: 'desc' };
        } else {
          return null; // Clear sort
        }
      } else {
        // Set new column sort
        return { key: columnId, direction: 'asc' };
      }
    });
  };

  // Get sort icon
  const getSortIcon = (columnId: string) => {
    if (sortConfig?.key !== columnId) {
      return <ChevronUp className="h-4 w-4 opacity-30" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  // Format cell value
  const formatCellValue = (value: any, columnId: string, isRichText?: boolean) => {
    if (value === null || value === undefined) return 'N/A';

    if (columnId === 'askingPrice' || columnId === 'minPrice' || columnId === 'hoaFee') {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0 
      }).format(value);
    }

    if (columnId === 'sqft' || columnId === 'acre') {
      return new Intl.NumberFormat('en-US').format(value);
    }

    if (columnId === 'latitude' || columnId === 'longitude') {
      return typeof value === 'number' ? value.toFixed(6) : value;
    }

    if (columnId === 'createdAt' || columnId === 'updatedAt') {
      return value ? new Date(value).toLocaleDateString() : 'N/A';
    }

    if (columnId === 'status') {
      return (
        <Badge className={
          value === 'Available' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
          value === 'Pending' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' :
          value === 'Sold' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
          'bg-gray-100 text-gray-800 hover:bg-gray-100'
        }>
          {value}
        </Badge>
      );
    }

    if (columnId === 'featured') {
      return value === 'Featured' || value === 'Yes' ? (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Featured
        </Badge>
      ) : 'No';
    }

    if (columnId === 'mobileHomeFriendly' || columnId === 'floodplain') {
      return value === true || value === 'Yes' ? 'Yes' : 'No';
    }

    if (isRichText && typeof value === 'string' && value.length > 100) {
      const cellKey = `${columnId}-${value.substring(0, 20)}`;
      const isExpanded = expandedCells[cellKey];
      
      return (
        <div>
          <div className={isExpanded ? '' : 'line-clamp-2'}>
            {value.replace(/<[^>]*>/g, '')} {/* Strip HTML tags */}
          </div>
          {value.length > 100 && (
            <button
              onClick={() => setExpandedCells(prev => ({
                ...prev,
                [cellKey]: !prev[cellKey]
              }))}
              className="text-blue-600 hover:text-blue-800 text-sm mt-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      );
    }

    return value.toString();
  };

  // Check if all visible properties are selected
  const isAllSelected = data.length > 0 && data.every(property => 
    selectedProperties.includes(property.id)
  );

  const isSomeSelected = selectedProperties.length > 0 && !isAllSelected;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading properties...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No properties found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {/* Select All Checkbox */}
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all properties"
                />
              </TableHead>
              
              {/* Column Headers */}
              {displayColumns.map((column) => (
                <TableHead 
                  key={column.id}
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort(column.id)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.name}</span>
                    {getSortIcon(column.id)}
                  </div>
                </TableHead>
              ))}
              
              {/* Actions Column */}
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {sortedData.map((property) => (
              <TableRow 
                key={property.id}
                className={`hover:bg-gray-50 transition-colors ${
                  selectedProperties.includes(property.id) ? 'bg-blue-50' : ''
                }`}
              >
                {/* Select Checkbox */}
                <TableCell>
                  <Checkbox
                    checked={selectedProperties.includes(property.id)}
                    onCheckedChange={(checked) => 
                      onSelectProperty(property.id, checked as boolean)
                    }
                    aria-label={`Select property ${property.streetAddress}`}
                  />
                </TableCell>
                
                {/* Data Cells */}
                {displayColumns.map((column) => {
                  const value = getColumnValue(property, column.id);
                  return (
                    <TableCell key={column.id} className="max-w-xs">
                      {formatCellValue(value, column.id, column.isRichText)}
                    </TableCell>
                  );
                })}
                
                {/* Actions Dropdown */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => window.open(`/properties/${property.id}`, '_blank')}
                      >
                        <Eye className="mr-2 h-4 w-4" /> 
                        View Property
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => window.open(`/admin/properties/${property.id}`, '_blank')}
                      >
                        <PencilIcon className="mr-2 h-4 w-4" /> 
                        Edit Property
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Table Footer */}
      <div className="border-t bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {data.length} {data.length === 1 ? 'property' : 'properties'} found
          </span>
          <span>
            {selectedProperties.length} selected
          </span>
        </div>
      </div>
    </div>
  );
}