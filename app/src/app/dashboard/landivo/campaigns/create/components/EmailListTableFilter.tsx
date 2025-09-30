// app/src/app/dashboard/landivo/campaigns/create/components/EmailListTableFilter.tsx
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';

interface Props {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  resultCount: number;
  totalCount: number;
}

export function EmailListTableFilter({
  searchQuery,
  setSearchQuery,
  clearSearch,
  resultCount,
  totalCount
}: Props) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-full sm:flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by list name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        {searchQuery && (
          <Badge variant="secondary" className="whitespace-nowrap">
            {resultCount} of {totalCount} lists
          </Badge>
        )}
      </div>

      {/* Active Filter Indicator */}
      {searchQuery && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Active search:</span>
          <Badge variant="outline" className="gap-1">
            {searchQuery}
            <button
              onClick={clearSearch}
              className="ml-1 hover:bg-gray-200 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
}