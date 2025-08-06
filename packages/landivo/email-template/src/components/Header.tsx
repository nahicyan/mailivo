// app/src/emails/components/Header.tsx
import React from 'react';
import { Section } from '@react-email/components';
import { Type } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface HeaderProps {
  className?: string;
  showBottomBorder?: boolean;
  logoWidth?: number;
  logoHeight?: number;
}

export function Header({ 
  className = '',
  showBottomBorder = true,
  logoWidth = 200,
  logoHeight = 70
}: HeaderProps) {
  return (
    <Section
      className={className}
      style={{
        width: '100%',
        // padding: '24px 0',
        textAlign: 'center',
        borderBottom: showBottomBorder ? '2px solid #e5e7eb' : 'none',
      }}
    >
      <div style={{ textAlign: 'center', margin: '0 auto' }}>
        <img 
          src="https://cdn.landivo.com/wp-content/uploads/2025/08/landivo.png"
          alt="Landivo Logo"
          width={logoWidth}
          height={logoHeight}
          style={{
            width: `${logoWidth}px`,
            height: `${logoHeight}px`,
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            margin: '0 auto'
          }}
        />
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const headerMetadata: EmailComponentMetadata = {
  type: 'header',
  name: 'header',
  displayName: 'Landivo Logo',
  version: 'v1.0',
  icon: <Type className="w-5 h-5" />,
  description: 'Add Landivo logo header with branding',
  category: 'content',
  available: true,
  defaultProps: {
    className: '',
    showBottomBorder: true,
    logoWidth: 200,
    logoHeight: 70
  },
  configFields: [
    {
      key: 'logoWidth',
      label: 'Logo Width',
      type: 'number',
      placeholder: '200',
      required: false,
      defaultValue: 200,
      description: 'Width of the logo in pixels'
    },
    {
      key: 'logoHeight',
      label: 'Logo Height',
      type: 'number',
      placeholder: '70',
      required: false,
      defaultValue: 70,
      description: 'Height of the logo in pixels'
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