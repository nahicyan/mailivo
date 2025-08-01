// packages/landivo/email-template/src/components/PropertyHighlights.tsx
import React from 'react';
import { Section, Row, Column, Text } from '@react-email/components';
import { Grid } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface PropertyHighlight {
  icon: 'size' | 'zoning' | 'survey' | 'financing';
  value: string;
  label: string;
  status?: 'available' | 'not-available' | 'pending';
}

interface PropertyHighlightsProps {
  className?: string;
  backgroundColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  itemSpacing?: number;
  propertyData?: any;
}

// SVG Icons as React components for email compatibility
const SizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
  </svg>
);

const ZoningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
  </svg>
);

const SurveyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const FinancingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const iconMap = {
  size: SizeIcon,
  zoning: ZoningIcon,
  survey: SurveyIcon,
  financing: FinancingIcon,
};

export function PropertyHighlights({
  className = '',
  backgroundColor = '#ffffff',
  borderRadius = 8,
  showBorder = true,
  itemSpacing = 16,
  propertyData
}: PropertyHighlightsProps) {
  
  // Extract highlights from property data (matches Landivo QuickFacts pattern)
  const getHighlights = (): PropertyHighlight[] => {
    if (!propertyData) {
      return [
        { icon: 'size', value: 'No Data', label: 'sqft' },
        { icon: 'zoning', value: 'No Data', label: 'Zoning' },
        { icon: 'survey', value: 'No Data', label: 'Survey', status: 'not-available' },
        { icon: 'financing', value: 'No Data', label: 'Financing', status: 'not-available' },
      ];
    }

    return [
      {
        icon: 'size' as const,
        value: propertyData.sqft?.toLocaleString() + ' sq ft' || 'Not Available',
        label: 'Size'
      },
      {
        icon: 'zoning' as const,
        value: propertyData.zoning ?? 'N/A',
        label: 'Zoning'
      },
      {
        icon: 'survey' as const,
        value: propertyData.survey?.toLocaleString() ?? 'Not Available',
        label: 'Survey',
        status: propertyData.survey ? 'available' as const : 'not-available' as const
      },
      {
        icon: 'financing' as const,
        value: propertyData.financing?.toLocaleString() ?? 'Not Available',
        label: 'Financing',
        status: propertyData.financing ? 'available' as const : 'not-available' as const
      }
    ];
  };

  const displayHighlights = getHighlights();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'available':
        return '#10b981'; // green
      case 'not-available':
        return '#f59e0b'; // amber
      case 'pending':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <Section
      className={`w-full py-4 ${className}`}
      style={{
        width: '100%',
        padding: '16px 20px',
        backgroundColor: '#f8f9fa',
        borderRadius: `${borderRadius}px`,
        border: 'none',
      }}
    >
      <Row style={{ width: '100%' }}>
        {displayHighlights.map((highlight, index) => {
          const IconComponent = iconMap[highlight.icon];
          return (
            <Column
              key={index}
              style={{
                width: '25%',
                padding: `0 ${itemSpacing / 4}px`,
                textAlign: 'center',
                verticalAlign: 'top',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  width: '100%',
                  maxWidth: '100px',
                  textAlign: 'center',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '0 auto 6px auto',
                    color: '#4b5563',
                  }}
                >
                  <IconComponent />
                </div>

                {/* Value */}
                <Text
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 1px 0',
                    lineHeight: '1.1',
                  }}
                >
                  {highlight.value}
                </Text>

                {/* Label */}
                <Text
                  style={{
                    fontSize: '11px',
                    fontWeight: '400',
                    color: '#9ca3af',
                    margin: '0',
                    lineHeight: '1.1',
                  }}
                >
                  {highlight.label}
                </Text>
              </div>
            </Column>
          );
        })}
      </Row>

      {/* Mobile responsive fallback */}
      <div style={{ display: 'none' }}>
        {displayHighlights.map((highlight, index) => {
          const IconComponent = iconMap[highlight.icon];
          return (
            <div
              key={`mobile-${index}`}
              style={{
                display: 'block',
                width: '48%',
                margin: '8px 1%',
                padding: '16px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                textAlign: 'center',
                float: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '40px',
                  height: '40px',
                  margin: '0 auto 8px auto',
                  backgroundColor: '#ffffff',
                  borderRadius: '50%',
                  border: '1px solid #e5e7eb',
                  color: '#6b7280',
                }}
              >
                <IconComponent />
              </div>
              <Text
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 2px 0',
                  lineHeight: '1.2',
                }}
              >
                {highlight.value}
              </Text>
              <Text
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: highlight.status ? getStatusColor(highlight.status) : '#6b7280',
                  margin: '0',
                  lineHeight: '1.2',
                }}
              >
                {highlight.label}
              </Text>
            </div>
          );
        })}
        <div style={{ clear: 'both' }}></div>
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const propertyHighlightsMetadata: EmailComponentMetadata = {
  type: 'property-highlights',
  name: 'property-highlights',
  displayName: 'PROPERTY HIGHLIGHTS',
  icon: <Grid className="w-5 h-5" />,
  description: 'Display key property features in a 4-column grid layout',
  category: 'content',
  available: true,
  defaultProps: {
    className: '',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    showBorder: true,
    itemSpacing: 16
  },
  configFields: [
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Background color of the highlights section'
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
      key: 'itemSpacing',
      label: 'Item Spacing',
      type: 'number',
      defaultValue: 16,
      description: 'Spacing between highlight items in pixels'
    },
    {
      key: 'className',
      label: 'CSS Classes',
      type: 'text',
      placeholder: 'Additional CSS classes',
      description: 'Add custom Tailwind classes for styling'
    }
  ],
  component: PropertyHighlights
};

export default PropertyHighlights;