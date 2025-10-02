// app/src/components/automation/VariableInput.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { EmojiTextEditor, EmojiTextEditorRef } from '@/components/EmojiText/emoji-text-editor';
import { ChevronDown, Hash } from 'lucide-react';

const AUTOMATION_VARIABLES = [
  { key: 'title', label: 'Property Title', example: 'Residential Land in Cedar Hill' },
  { key: 'streetAddress', label: 'Street Address', example: '1744 West Belt Line Road' },
  { key: 'city', label: 'City', example: 'Cedar Hill' },
  { key: 'county', label: 'County', example: 'Dallas County' },
  { key: 'state', label: 'State', example: 'Texas' },
  { key: 'zip', label: 'ZIP Code', example: '75105' },
  { key: '#', label: 'Counter (#)', example: 'Sequential number starting from 1' },
] as const;

const ADDRESS_FORMAT_OPTIONS = [
  { label: 'Street, City, State ZIP', value: '{streetAddress}, {city}, {state} {zip}' },
  { label: 'City, State ZIP', value: '{city}, {state} {zip}' },
  { label: 'County, State ZIP', value: '{county}, {state} {zip}' },
  { label: 'City, State', value: '{city}, {state}' },
];

interface VariableInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function VariableInput({ label, value, onChange, placeholder, error }: VariableInputProps) {
  const editorRef = useRef<EmojiTextEditorRef>(null);
  const [isVariableOpen, setIsVariableOpen] = React.useState(false);
  const [isAddressOpen, setIsAddressOpen] = React.useState(false);

  useEffect(() => {
    if (value) {
      editorRef.current?.setContent(value);
    }
  }, []);

  const insertVariable = (variableKey: string) => {
    editorRef.current?.insertAtCursor(`{${variableKey}}`);
    setIsVariableOpen(false);
  };

  const insertAddressFormat = (format: string) => {
    editorRef.current?.insertAtCursor(format);
    setIsAddressOpen(false);
  };

  const usedVariables = React.useMemo(() => {
    const matches = value.match(/\{([^}]+)\}/g) || [];
    return matches.map(m => m.replace(/[{}]/g, ''));
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label} *</Label>
        <div className="flex gap-2">
          <Popover open={isAddressOpen} onOpenChange={setIsAddressOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
                Address <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="end">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                  Address Formats
                </div>
                {ADDRESS_FORMAT_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => insertAddressFormat(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover open={isVariableOpen} onOpenChange={setIsVariableOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
                Variable <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="end">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                  Available Variables
                </div>
                {AUTOMATION_VARIABLES.map((variable) => (
                  <Button
                    key={variable.key}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-auto py-2 flex-col items-start"
                    onClick={() => insertVariable(variable.key)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {variable.key === '#' && <Hash className="h-3 w-3" />}
                      <span className="font-medium">{variable.label}</span>
                    </div>
                    <span className="text-muted-foreground mt-0.5">{variable.example}</span>
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <EmojiTextEditor
        ref={editorRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={150}
        showEmojiPicker={true}
        className="min-h-[100px]"
      />

      {usedVariables.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {usedVariables.map((v, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">{v}</Badge>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-muted-foreground">
        {usedVariables.length === 0 
          ? '⚠️ At least one variable is required'
          : '✓ Variables will be replaced with property data'
        }
      </p>
    </div>
  );
}