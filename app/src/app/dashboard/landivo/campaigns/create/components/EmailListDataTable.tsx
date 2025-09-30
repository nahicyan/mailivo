// app/src/app/dashboard/landivo/campaigns/create/components/EmailListDataTable.tsx
'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EmailList {
  id: string;
  name: string;
  description?: string;
  totalContacts: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  data: EmailList[];
  selectedLists: string[];
  onSelectList: (listId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  loading: boolean;
  isSingleSelect?: boolean;
}

export function EmailListDataTable({
  data,
  selectedLists,
  onSelectList,
  onSelectAll,
  loading,
  isSingleSelect = false
}: Props) {
  
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Loading email lists...</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <Users className="h-12 w-12 text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">No email lists found</p>
              <p className="text-sm text-gray-500 mt-1">Create an email list to get started</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white">
      {/* Table Container with custom scrollbar */}
      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {/* Select All Checkbox (only for multi-select) */}
              <TableHead className="w-12">
                {!isSingleSelect && (
                  <Checkbox
                    checked={selectedLists.length === data.length && data.length > 0}
                    onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                    aria-label="Select all lists"
                  />
                )}
              </TableHead>
              
              <TableHead className="min-w-[200px]">List Name</TableHead>
              <TableHead className="min-w-[300px]">Description</TableHead>
              <TableHead className="w-32 text-center">Contacts</TableHead>
              <TableHead className="w-40">Last Updated</TableHead>
              <TableHead className="w-24 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((list) => {
              const isSelected = selectedLists.includes(list.id);
              
              return (
                <TableRow 
                  key={list.id}
                  className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  {/* Selection Control */}
                  <TableCell>
                    {isSingleSelect ? (
                      <RadioGroupItem
                        value={list.id}
                        checked={isSelected}
                        onClick={() => onSelectList(list.id, true)}
                      />
                    ) : (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => 
                          onSelectList(list.id, checked as boolean)
                        }
                        aria-label={`Select ${list.name}`}
                      />
                    )}
                  </TableCell>
                  
                  {/* List Name */}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{list.name}</span>
                      {isSelected && (
                        <Badge variant="default" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Description */}
                  <TableCell>
                    <span className="text-sm text-gray-600 line-clamp-2">
                      {list.description || 'No description'}
                    </span>
                  </TableCell>
                  
                  {/* Contact Count */}
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono">
                      {list.totalContacts.toLocaleString()}
                    </Badge>
                  </TableCell>
                  
                  {/* Last Updated */}
                  <TableCell>
                    <span className="text-xs text-gray-500">
                      {formatDate(list.updatedAt)}
                    </span>
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/dashboard/email-lists/${list.id}`, '_blank')}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View list</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Table Footer */}
      <div className="border-t bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {data.length} {data.length === 1 ? 'list' : 'lists'} available
          </span>
          <span>
            {selectedLists.length} selected
          </span>
        </div>
      </div>
    </div>
  );
}

// Custom scrollbar styles
const styles = `
  .custom-scrollbar::-webkit-scrollbar {
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;