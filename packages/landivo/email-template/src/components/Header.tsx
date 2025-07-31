// app/src/emails/components/Header.tsx
import React from 'react';
import { Text } from '@react-email/components';
import { Type } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface HeaderProps {
  className?: string;
  showBottomBorder?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  text?: string;
}

export function Header({ 
  className = '',
  showBottomBorder = true,
  textAlign = 'center',
  text = 'Landivo'
}: HeaderProps) {
  return (
    <Text
      className={`text-2xl font-bold text-gray-800 py-4 ${className}`}
      style={{
        textAlign,
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1f2937',
        padding: '16px 0',
        borderBottom: showBottomBorder ? '2px solid #e5e7eb' : 'none',
      }}
    >
      {text}
    </Text>
  );
}

// Component metadata for the template builder
export const headerMetadata: EmailComponentMetadata = {
  type: 'header',
  name: 'header',
  displayName: 'HEADING',
  icon: <Type className="w-5 h-5" />,
  description: 'Add header with Landivo branding',
  category: 'content',
  available: true,
  defaultProps: {
    className: '',
    showBottomBorder: true,
    textAlign: 'center',
    text: 'Landivo'
  },
  configFields: [
    {
      key: 'text',
      label: 'Header Text',
      type: 'text',
      placeholder: 'Enter header text',
      required: true,
      defaultValue: 'Landivo',
      description: 'The text to display in the header'
    },
    {
      key: 'textAlign',
      label: 'Text Alignment',
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ],
      defaultValue: 'center',
      description: 'How to align the header text'
    },
    {
      key: 'showBottomBorder',
      label: 'Show Bottom Border',
      type: 'toggle',
      defaultValue: true,
      description: 'Display a border below the header'
    },
    {
      key: 'className',
      label: 'CSS Classes',
      type: 'text',
      placeholder: 'Additional CSS classes',
      description: 'Add custom Tailwind classes for styling'
    }
  ],
  component: Header
};

export default Header;