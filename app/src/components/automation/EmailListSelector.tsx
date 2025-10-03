// app/src/components/automation/EmailListSelector.tsx
'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface EmailListSelectorProps {
  emailLists: Array<{ id: string; name: string; totalContacts?: number }>;
  value: string;
  matchAllList: boolean;
  onChange: (value: string) => void;
  onMatchAllListChange: (enabled: boolean) => void;
}

export function EmailListSelector({ 
  emailLists, 
  value, 
  matchAllList, 
  onChange, 
  onMatchAllListChange 
}: EmailListSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Email List *</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Match All List</span>
          <Switch
            checked={matchAllList}
            onCheckedChange={onMatchAllListChange}
          />
        </div>
      </div>

      {matchAllList ? (
        <div>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select match criteria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Match-Title">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Match</Badge>
                  Match by Title
                </div>
              </SelectItem>
              <SelectItem value="Match-Area">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Match</Badge>
                  Match by Area
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Automatically match recipients based on List {value === 'Match-Title' ? 'title' : 'area'}
          </p>
        </div>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select email list" />
          </SelectTrigger>
          <SelectContent>
            {emailLists.map((list) => (
              <SelectItem key={list.id} value={list.id}>
                {list.name} ({list.totalContacts || 0} contacts)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}