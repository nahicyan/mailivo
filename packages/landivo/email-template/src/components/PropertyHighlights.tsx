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

// Icon URLs for each highlight type
const iconUrls = {
  size: 'https://cdn.landivo.com/wp-content/uploads/2025/08/arrows-pointing-out.png',
  zoning: 'https://cdn.landivo.com/wp-content/uploads/2025/08/map.png',
  survey: 'https://cdn.landivo.com/wp-content/uploads/2025/08/map-pin.png',
  financing: 'https://cdn.landivo.com/wp-content/uploads/2025/08/currency-dollar.png',
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
        { icon: 'size', value: '21,154 sq ft', label: 'Size' },
        { icon: 'zoning', value: 'Residential', label: 'Zoning' },
        { icon: 'survey', value: 'Not Available', label: 'Survey', status: 'not-available' },
        { icon: 'financing', value: 'Available', label: 'Financing', status: 'available' },
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
        value: propertyData.financing?.toLocaleString() ?? 'Available',
        label: 'Financing',
        status: propertyData.financing ? 'available' as const : 'available' as const
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
        padding: '16px 0',
      }}
    >
      {/* Container with proper width constraints like PropertyStatus */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '16px 20px',
        backgroundColor: '#f8f9fa',
        borderRadius: `${borderRadius}px`,
        border: 'none',
      }}>
        {/* Using table layout for better Gmail compatibility */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          borderSpacing: '0',
        }}>
          <tbody>
            <tr>
              {displayHighlights.map((highlight, index) => (
                <td
                  key={index}
                  style={{
                    width: '25%',
                    padding: `0 ${itemSpacing / 2}px`,
                    textAlign: 'center',
                    verticalAlign: 'top',
                  }}
                >
                  <div style={{
                    display: 'block',
                    textAlign: 'center',
                  }}>
                    {/* Icon */}
                    <div style={{
                      marginBottom: '8px',
                      textAlign: 'center',
                    }}>
                      <img
                        src={iconUrls[highlight.icon]}
                        alt={highlight.label}
                        style={{
                          width: '24px',
                          height: '24px',
                          display: 'inline-block',
                          verticalAlign: 'middle',
                        }}
                      />
                    </div>

                    {/* Value (Data) - larger text */}
                    <Text
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: '0 0 4px 0',
                        lineHeight: '1.2',
                        display: 'block',
                      }}
                    >
                      {highlight.value}
                    </Text>

                    {/* Label - smaller, darker text */}
                    <Text
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        margin: '0',
                        lineHeight: '1.2',
                        display: 'block',
                      }}
                    >
                      {highlight.label}
                    </Text>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const propertyHighlightsMetadata: EmailComponentMetadata = {
  type: 'property-highlights',
  name: 'property-highlights',
  displayName: 'Property Highlights',
  version: 'v1.0',
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