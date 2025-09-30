// app/src/app/dashboard/landivo/campaigns/create/components/EmailListSelection.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListChecks, AlertCircle, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmailListDataTable } from './EmailListDataTable';
import { EmailListTableFilter } from './EmailListTableFilter';

interface EmailList {
  id: string;
  name: string;
  description?: string;
  totalContacts: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  errors: Record<string, string>;
  emailLists: EmailList[];
  listsLoading: boolean;
  listsError: any;
  refetchLists: () => void;
}

export function EmailListSelection({ 
  formData, 
  setFormData, 
  errors, 
  emailLists = [], 
  listsLoading, 
  listsError,
  refetchLists
}: Props) {
  // Single selection stored as array for consistency with multi-select
  const [selectedLists, setSelectedLists] = useState<string[]>(
    formData.emailList ? [formData.emailList] : []
  );
  
  const [searchQuery, setSearchQuery] = useState("");

  // Filter email lists based on search
  const filteredLists = useMemo(() => {
    if (!searchQuery.trim()) return emailLists;
    
    const query = searchQuery.toLowerCase();
    return emailLists.filter(list => 
      list.name.toLowerCase().includes(query) ||
      list.description?.toLowerCase().includes(query)
    );
  }, [emailLists, searchQuery]);

  // Handle single selection
  const handleSelectList = (listId: string, checked: boolean) => {
    if (checked) {
      setSelectedLists([listId]);
      setFormData(prev => ({ ...prev, emailList: listId }));
    } else {
      setSelectedLists([]);
      setFormData(prev => ({ ...prev, emailList: '' }));
    }
  };

  const clearSearch = () => setSearchQuery("");

  // Get selected list info
  const selectedList = emailLists.find(list => list.id === selectedLists[0]);
  const totalContacts = selectedList?.totalContacts || 0;

  // Handle error state
  if (listsError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load email lists. Please try again.</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetchLists}
                className="ml-4"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ListChecks className="h-5 w-5" />
            <span>Select Email List</span>
          </CardTitle>
          <div className="text-sm text-gray-600">
            Choose one email list to send your campaign to.
          </div>
        </CardHeader>
      </Card>

      {/* Selection Summary */}
      {selectedList && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="default" className="px-3 py-1">
                  List Selected
                </Badge>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{selectedList.name}</span>
                  <span className="text-xs text-gray-500">
                    {totalContacts.toLocaleString()} contacts
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSelectList(selectedList.id, false)}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <EmailListTableFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        clearSearch={clearSearch}
        resultCount={filteredLists.length}
        totalCount={emailLists.length}
      />

      {/* Email Lists Table */}
      <EmailListDataTable
        data={filteredLists}
        selectedLists={selectedLists}
        onSelectList={handleSelectList}
        onSelectAll={() => {}} // Not used for single select
        loading={listsLoading}
        isSingleSelect={true}
      />

      {/* Validation Error */}
      {errors.emailList && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.emailList}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}