// app/src/types/component-metadata.ts
import { ReactNode } from 'react';

export interface ComponentConfigField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'number' | 'select' | 'boolean' | 'toggle';
  options?: { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  description?: string;
  min?: number; 
  max?: number;
}

export interface EmailComponentMetadata {
  type: string;
  templateType: 'single' | 'multi' | 'any';
  name: string;
  displayName: string;
  version: string;
  icon: ReactNode;
  description: string;
  category: 'content' | 'layout' | 'media' | 'navigation';
  available: boolean;
  defaultProps: Record<string, any>;
  configFields: ComponentConfigField[];
  component: React.ComponentType<any>;
}

export interface ComponentRegistry {
  [key: string]: EmailComponentMetadata;
}