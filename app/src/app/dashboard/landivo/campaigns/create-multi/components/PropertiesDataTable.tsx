// app/src/app/dashboard/landivo/campaigns/create-multi/components/PropertiesDataTable.tsx
// MINIMAL CHANGE: Only added isSingleSelect prop support
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  onSortOrderChange?: (sortedData: Property[]) => void;
  loading: boolean;
  isSingleSelect?: boolean; // ADDED: Optional single-select mode
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
  onSortOrderChange,
  loading,
  isSingleSelect = false // ADDED: Default to false for backward compatibility
}: Props) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [expandedCells, setExpandedCells] = useState<{[key: string]: boolean}>({});

  // CSS for rich text cells
  const richTextCellStyles = `
    .rich-text-cell {
      line-height: 1.5;
      transition: max-height 0.3s ease-in-out;
    }
    
    .rich-text-cell p {
      margin-bottom: 0.5rem;
    }
    
    .rich-text-cell h1, .rich-text-cell h2, .rich-text-cell h3, 
    .rich-text-cell h4, .rich-text-cell h5, .rich-text-cell h6 {
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    
    .rich-text-cell ul, .rich-text-cell ol {
      margin-left: 1.5rem;
      margin-bottom: 0.5rem;
    }
    
    .rich-text-cell a {
      color: #3b82f6;
      text-decoration: underline;
    }

    .sticky-checkbox-header {
      position: sticky;
      left: 0;
      z-index: 10;
      background-color: rgb(249 250 251);
      border-right: 1px solid rgb(229 231 235);
      padding-right: 16px;
    }

    .sticky-checkbox-cell {
      position: sticky;
      left: 0;
      z-index: 5;
      background-color: white;
      border-right: 1px solid rgb(229 231 235);
      padding-right: 16px;
    }

    .sticky-checkbox-cell.selected {
      background-color: rgb(239 246 255);
    }
  `;

  // Helper function to render rich text content with truncation
  const renderRichTextContent = (content: any, rowId: string, columnId: string, maxLength = 100) => {
    if (!content) return <span className="text-gray-400">N/A</span>;
    
    const isExpanded = expandedCells[`${rowId}-${columnId}`];
    
    // Strip HTML to get approximate text length for truncation decision
    const textContent = content.replace(/<[^>]*>/g, '');
    const needsTruncation = textContent.length > maxLength;
    
    // Create a safe version of the content for display
    const displayContent = isExpanded || !needsTruncation ? 
      content : 
      content.substring(0, maxLength) + '...';
    
    return (
      <div className="relative">
        <div
          className={`rich-text-cell ${isExpanded ? 'max-h-none' : 'max-h-24 overflow-hidden'}`}
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
        
        {needsTruncation && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedCells(prev => ({
                ...prev,
                [`${rowId}-${columnId}`]: !prev[`${rowId}-${columnId}`]
              }));
            }}
            className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center"
          >
            {isExpanded ? (
              <>Show less <ChevronUp className="ml-1 h-3 w-3" /></>
            ) : (
              <>Show more <ChevronDown className="ml-1 h-3 w-3" /></>
            )}
          </button>
        )}
      </div>
    );
  };

  // Get visible column configurations
  const displayColumns = useMemo(() => {
    return availableColumns.filter(col => visibleColumns.includes(col.id));
  }, [availableColumns, visibleColumns]);

  // Get column value for sorting
  const getColumnValue = (row: Property, columnId: string): any => {
    const column = availableColumns.find(col => col.id === columnId);
    if (!column) return '';

    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }

    return row[column.accessor as keyof Property];
  };

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

  // Notify parent of sorted data
  useEffect(() => {
    if (onSortOrderChange) {
      onSortOrderChange(sortedData);
    }
  }, [sortedData, onSortOrderChange]);

  // Handle sort
  const handleSort = (columnId: string) => {
    setSortConfig(prev => {
      if (prev?.key === columnId) {
        // Toggle direction or clear
        if (prev.direction === 'asc') {
          return { key: columnId, direction: 'desc' };
        }
        return null; // Clear sort
      }
      return { key: columnId, direction: 'asc' };
    });
  };

  // Get sort icon
  const getSortIcon = (columnId: string) => {
    if (sortConfig?.key !== columnId) return null;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0 
    }).format(amount);

  // Format number
  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-US').format(num);

  // Format cell value
  const formatCellValue = (value: any, columnId: string, propertyId: string, isRichText?: boolean) => {
    if (value === null || value === undefined) return <span className="text-gray-400">N/A</span>;

    if (isRichText) {
      return renderRichTextContent(value, propertyId, columnId);
    }

    if (columnId === 'askingPrice' || columnId === 'minPrice') {
      return formatCurrency(Number(value));
    }

    if (columnId === 'sqft' || columnId === 'acre') {
      return formatNumber(Number(value));
    }

    if (columnId === 'status') {
      return (
        <Badge className={
          value === 'Active' ? 
          'bg-green-100 text-green-800 hover:bg-green-100' :
          value === 'Available' ?
          'bg-blue-100 text-blue-800 hover:bg-blue-100' :
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
      {/* Inject CSS for rich text styling */}
      <style>{richTextCellStyles}</style>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {/* Select All Checkbox - Sticky */}
              <TableHead className="w-12 sticky-checkbox-header">
                <Checkbox
                  checked={isAllSelected}
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
                  selectedProperties.includes(property.id) ?
                  'bg-blue-50' : ''
                }`}
              >
                {/* Select Checkbox - Sticky */}
                <TableCell className={`sticky-checkbox-cell ${
                  selectedProperties.includes(property.id) ? 'selected' : ''
                }`}>
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
                      {formatCellValue(value, column.id, property.id, column.isRichText)}
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