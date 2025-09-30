// app/src/app/dashboard/landivo/campaigns/create-multi/components/MultiEmailListSelection.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ListChecks, AlertCircle, RefreshCcw, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmailListDataTable } from '../../create/components/EmailListDataTable';
import { EmailListTableFilter } from '../../create/components/EmailListTableFilter';

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

export function MultiEmailListSelection({ 
  formData, 
  setFormData, 
  errors, 
  emailLists = [], 
  listsLoading, 
  listsError,
  refetchLists
}: Props) {
  // Can be single or multi-select
  const [isSingleSelect, setIsSingleSelect] = useState(false);
  
  const [selectedLists, setSelectedLists] = useState<string[]>(() => {
    // Initialize from formData
    if (formData.emailList) {
      return [formData.emailList];
    }
    return [];
  });
  
  const [searchQuery, setSearchQuery] = useState("");

  // Filter email lists
  const filteredLists = useMemo(() => {
    if (!searchQuery.trim()) return emailLists;
    
    const query = searchQuery.toLowerCase();
    return emailLists.filter(list => 
      list.name.toLowerCase().includes(query) ||
      list.description?.toLowerCase().includes(query)
    );
  }, [emailLists, searchQuery]);

  // Toggle selection mode
  const handleSelectionModeChange = (checked: boolean) => {
    const newMode = checked;
    setIsSingleSelect(newMode);
    
    if (newMode && selectedLists.length > 1) {
      // Keep only first selection when switching to single
      const firstList = selectedLists[0];
      setSelectedLists([firstList]);
      setFormData(prev => ({ 
        ...prev, 
        emailList: firstList
      }));
    }
  };

  // Handle selection
  const handleSelectList = (listId: string, checked: boolean) => {
    if (isSingleSelect) {
      if (checked) {
        setSelectedLists([listId]);
        setFormData(prev => ({ 
          ...prev, 
          emailList: listId
        }));
      } else {
        setSelectedLists([]);
        setFormData(prev => ({ 
          ...prev, 
          emailList: ''
        }));
      }
    } else {
      const newSelection = checked 
        ? [...selectedLists, listId]
        : selectedLists.filter(id => id !== listId);
      
      setSelectedLists(newSelection);
      // Store first item in emailList for validation, and all in a custom field
      setFormData(prev => ({ 
        ...prev, 
        emailList: newSelection[0] || '',
        emailListsMulti: newSelection // Store all selections
      }));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (isSingleSelect) return;
    
    if (checked) {
      const allIds = filteredLists.map(list => list.id);
      setSelectedLists(allIds);
      setFormData(prev => ({ 
        ...prev, 
        emailList: allIds[0] || '',
        emailListsMulti: allIds
      }));
    } else {
      setSelectedLists([]);
      setFormData(prev => ({ 
        ...prev, 
        emailList: '',
        emailListsMulti: []
      }));
    }
  };

  const clearSearch = () => setSearchQuery("");

  // Calculate stats
  const totalContacts = selectedLists.reduce((sum, listId) => {
    const list = emailLists.find(l => l.id === listId);
    return sum + (list?.totalContacts || 0);
  }, 0);

  if (listsError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load email lists. Please try again.</span>
              <Button variant="outline" size="sm" onClick={refetchLists} className="ml-4">
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
            <span>Select Email Lists</span>
          </CardTitle>
          <div className="text-sm text-gray-600">
            Choose one or multiple email lists for your multi-property campaign.
          </div>
        </CardHeader>
      </Card>

      {/* Selection Mode Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Switch
                id="selection-mode"
                checked={isSingleSelect}
                onCheckedChange={handleSelectionModeChange}
              />
              <div>
                <Label htmlFor="selection-mode" className="text-sm font-medium">
                  {isSingleSelect ? 'Single Selection Mode' : 'Multiple Selection Mode'}
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isSingleSelect 
                    ? 'Select one email list only' 
                    : 'Select multiple email lists'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Summary */}
      {selectedLists.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="default" className="px-3 py-1">
                  {selectedLists.length} {selectedLists.length === 1 ? 'list' : 'lists'} selected
                </Badge>
                <span className="text-sm text-gray-600">
                  {totalContacts.toLocaleString()} total contacts
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

      {/* Info Alert */}
      {!isSingleSelect && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            When multiple lists are selected, emails will be sent to all unique contacts across all lists.
          </AlertDescription>
        </Alert>
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
        onSelectAll={handleSelectAll}
        loading={listsLoading}
        isSingleSelect={isSingleSelect}
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