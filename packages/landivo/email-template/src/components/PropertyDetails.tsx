// packages/landivo/email-template/src/components/PropertyDetails.tsx
import React from 'react';
import { Section, Text } from '@react-email/components';
import { MapPin } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface PropertyDetailsProps {
  className?: string;
  backgroundColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  textColor?: string;
  labelColor?: string;
  spacing?: number;
  propertyData?: any;
}

export function PropertyDetails({
  className = '',
  backgroundColor = '#ffffff',
  borderRadius = 8,
  showBorder = true,
  textColor = '#1f2937',
  labelColor = '#6b7280',
  spacing = 16,
  propertyData
}: PropertyDetailsProps) {
  
  // Extract location data
  const getLocationData = () => {
    return {
      county: propertyData?.county || 'N/A',
      state: propertyData?.state || 'N/A',
      zip: propertyData?.zip || 'N/A'
    };
  };

  // Extract property details data
  const getPropertyData = () => {
    return {
      size: propertyData?.sqft ? `${propertyData.sqft.toLocaleString()} sqft` : 'N/A',
      acreage: propertyData?.acre?.toString() || 'N/A',
      zoning: propertyData?.zoning || 'N/A'
    };
  };

  const locationData = getLocationData();
  const propertyDetails = getPropertyData();

  const containerStyle = {
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: showBorder ? '1px solid #e5e7eb' : 'none',
    padding: `${spacing / 2}px`,
    margin: '0 auto',
    maxWidth: '600px',
    width: '100%',
  };

  const columnStyle = {
    width: '50%',
    verticalAlign: 'top' as const,
    padding: `0 ${spacing}px`,
  };

  const headerStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: textColor,
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '2px solid #e5e7eb',
  };

  const itemStyle = {
    marginBottom: '8px',
    display: 'table',
    width: '100%',
  };

  const labelStyle = {
    fontSize: '15px',
    fontWeight: '600',
    color: textColor,
    margin: '0',
    display: 'table-cell',
    width: '50%',
  };

  const valueStyle = {
    fontSize: '15px',
    fontWeight: '400',
    color: textColor,
    textAlign: 'right' as const,
    margin: '0',
    display: 'table-cell',
    width: '50%',
  };

  return (
    <Section 
      className={`w-full py-4 ${className}`} 
      style={{
        width: '100%',
        padding: '16px 0', //
      }}
    >
      <div style={containerStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              {/* Location Column */}
              <td style={columnStyle}>
                <Text style={headerStyle}>
                  Location
                </Text>
                
                <div style={itemStyle}>
                  <Text style={labelStyle}>County</Text>
                  <Text style={valueStyle}>{locationData.county}</Text>
                </div>
                
                <div style={itemStyle}>
                  <Text style={labelStyle}>State</Text>
                  <Text style={valueStyle}>{locationData.state}</Text>
                </div>
                
                <div style={itemStyle}>
                  <Text style={labelStyle}>Zip</Text>
                  <Text style={valueStyle}>{locationData.zip}</Text>
                </div>
              </td>

              {/* Property Details Column */}
              <td style={columnStyle}>
                <Text style={headerStyle}>
                  Property Details
                </Text>
                
                <div style={itemStyle}>
                  <Text style={labelStyle}>Size</Text>
                  <Text style={valueStyle}>{propertyDetails.size}</Text>
                </div>
                
                <div style={itemStyle}>
                  <Text style={labelStyle}>Acreage</Text>
                  <Text style={valueStyle}>{propertyDetails.acreage}</Text>
                </div>
                
                <div style={itemStyle}>
                  <Text style={labelStyle}>Zoning</Text>
                  <Text style={valueStyle}>{propertyDetails.zoning}</Text>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const propertyDetailsMetadata: EmailComponentMetadata = {
  type: 'property-details',
  name: 'property-details',
  displayName: 'Property Details',
  version: 'v1.0',
  icon: <MapPin className="w-5 h-5" />,
  description: 'Display property location and details in a two-column layout',
  category: 'content',
  available: true,
  defaultProps: {
    className: '',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    showBorder: true,
    textColor: '#1f2937',
    labelColor: '#6b7280',
    spacing: 16
  },
  configFields: [
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Background color of the details section'
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
      defaultValue: '#1f2937',
      description: 'Color for the main text values'
    },
    {
      key: 'labelColor',
      label: 'Label Color',
      type: 'color',
      defaultValue: '#6b7280',
      description: 'Color for the field labels'
    },
    {
      key: 'spacing',
      label: 'Inner Spacing',
      type: 'number',
      defaultValue: 16,
      description: 'Internal padding in pixels'
    },
    {
      key: 'className',
      label: 'CSS Classes',
      type: 'text',
      placeholder: 'Additional CSS classes',
      description: 'Add custom classes for styling'
    }
  ],
  component: PropertyDetails
};

export default PropertyDetails;