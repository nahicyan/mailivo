// packages/landivo/email-template/src/components/BuyerGuidelines.tsx
import React from 'react';
import { Section, Text } from '@react-email/components';
import { FileText } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface BuyerGuidelinesProps {
  className?: string;
  backgroundColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  textColor?: string;
  showIcon?: boolean;
}

export function BuyerGuidelines({
  className = '',
  backgroundColor = '#f8f9fa',
  borderRadius = 8,
  showBorder = true,
  textColor = '#374151',
  showIcon = true
}: BuyerGuidelinesProps) {
  
  const guidelines = [
    'Buyer pays ALL closing costs.',
    'Cash OR Hard Money Only.',
    'A $395 transaction fee applies to each contract and is payable by the buyer.',
    'This Property is being sold AS-IS.',
    'No Daisy Chaining – No Option Period.',
    'Due diligence required before submitting an offer.',
    'Agents, please add your commission to the buyer\'s sales price.',
    'Earnest money deposit varies per property.',
    'Closing ASAP.'
  ];

  return (
    <Section
      className={className}
      style={{
        width: '100%',
        // padding: '16px 0',
      }}
    >
      {/* Container with proper width constraints like other components */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: backgroundColor,
        borderRadius: `${borderRadius}px`,
        border: showBorder ? '1px solid #e5e7eb' : 'none',
      }}>
        {/* Header with icon and title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          {showIcon && (
            <img
              src="https://cdn.landivo.com/wp-content/uploads/2025/08/notebook-pen.png"
              alt="Buyer Guidelines"
              style={{
                width: '20px',
                height: '20px',
                display: 'inline-block',
                marginRight: '12px',
              }}
            />
          )}
          <Text
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0',
              lineHeight: '1.2',
            }}
          >
            Buyer Guidelines
          </Text>
        </div>

        {/* Guidelines list */}
        <div style={{
          display: 'block',
        }}>
          {guidelines.map((guideline, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>
              <Text
                style={{
                  fontSize: '13px',
                  fontWeight: '400',
                  color: '#6b7280',
                  margin: '0',
                  lineHeight: '1.4',
                  display: 'block',
                }}
              >
                {guideline}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const buyerGuidelinesMetadata: EmailComponentMetadata = {
  type: 'buyer-guidelines',
  name: 'buyer-guidelines',
  displayName: 'Buyer Guidelines',
  version: 'v1.0',
  icon: <FileText className="w-5 h-5" />,
  description: 'Display buyer guidelines and terms in a compact format',
  category: 'content',
  available: true,
  defaultProps: {
    className: '',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    showBorder: true,
    textColor: '#374151',
    showIcon: true
  },
  configFields: [
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#f8f9fa',
      description: 'Background color of the guidelines section'
    },
    {
      key: 'borderRadius',
      label: 'Border Radius',
      type: 'number',
      defaultValue: 8,
      description: 'Corner radius in pixels'
    },
    {
      key: 'showBorder',
      label: 'Show Border',
      type: 'toggle',
      defaultValue: true,
      description: 'Display border around the component'
    },
    {
      key: 'textColor',
      label: 'Text Color',
      type: 'color',
      defaultValue: '#374151',
      description: 'Color of the guideline text'
    },
    {
      key: 'showIcon',
      label: 'Show Icon',
      type: 'toggle',
      defaultValue: true,
      description: 'Display the notebook icon next to the title'
    },
    {
      key: 'className',
      label: 'CSS Classes',
      type: 'text',
      placeholder: 'Additional CSS classes',
      description: 'Add custom Tailwind classes for styling'
    }
  ],
  component: BuyerGuidelines
};

export default BuyerGuidelines;