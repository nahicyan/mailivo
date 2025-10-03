// app/src/components/automation/EmailSubjectToggle.tsx
'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface EmailSubjectToggleProps {
  value: string;
  useFromLandivo: boolean;
  onChange: (value: string) => void;
  onToggleChange: (useFromLandivo: boolean) => void;
}

export function EmailSubjectToggle({ 
  value, 
  useFromLandivo, 
  onChange, 
  onToggleChange 
}: EmailSubjectToggleProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Email Subject *</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {useFromLandivo ? 'Use From Landivo' : 'Override'}
          </span>
          <Switch
            checked={!useFromLandivo}
            onCheckedChange={(checked) => onToggleChange(!checked)}
          />
        </div>
      </div>
      
      {useFromLandivo ? (
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Bypass</Badge>
            <span className="text-sm text-muted-foreground">
              Subject will be pulled from Landivo property data
            </span>
          </div>
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., New Property Available in {city}"
          className="mt-1"
        />
      )}
    </div>
  );
}