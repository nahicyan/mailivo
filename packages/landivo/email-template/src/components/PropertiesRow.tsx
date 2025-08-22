// packages/landivo/email-template/src/components/PropertiesRow.tsx
import React from 'react';
import {
  Section,
  Text,
  Img,
} from '@react-email/components';
import { EmailComponentMetadata } from '../types/component-metadata';
import { Grid } from 'lucide-react';

export interface PropertiesRowProps {
  className?: string;
  backgroundColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  properties?: Property[];
  addressFormat?: string;
  pricingStyle?: 'askingPrice' | 'askingPriceWithPayment' | 'disPrice' | 'disPriceWithPayment' | 'discount' | 'discountWithPayment';
  primaryColor?: string;
  textColor?: string;
  priceColor?: string;
  imageHeight?: number;
  propertySpacing?: number;
}

interface Property {
  id: string;
  images?: string[];
  county?: string;
  city?: string;
  state?: string;
  zip?: string;
  streetAddress?: string;
  acre?: number;
  askingPrice?: number;
  disPrice?: number;
  minPrice?: number;
  monthlyPayment?: number;
  planName?: string;
}

const ADDRESS_FORMAT_TEMPLATES: Record<string, string> = {
  '{county}': 'county',
  '{city}': 'city', 
  '{state}': 'state',
  '{state} {zip}': 'state_zip',
  '{city} {zip}': 'city_zip',
  '{county}, {state} {zip}': 'county_state_zip',
  '{city}, {state} {zip}': 'city_state_zip',
  '{county}, {city}, {state} {zip}': 'full_address'
};

export function PropertiesRow({
  className = '',
  backgroundColor = '#ffffff',
  borderRadius = 8,
  showBorder = false,
  properties = [],
  addressFormat = '{city}, {state} {zip}',
  pricingStyle = 'askingPrice',
  primaryColor = '#2563eb',
  textColor = '#374151',
  priceColor = '#059669',
  imageHeight = 200,
  propertySpacing = 16
}: PropertiesRowProps) {

  // Ensure we show exactly 3 properties (pad with empty if needed)
  const displayProperties = [...properties];
  while (displayProperties.length < 3) {
    displayProperties.push({
      id: `empty-${displayProperties.length}`,
      county: '',
      city: '',
      state: '',
      zip: '',
      streetAddress: '',
      acre: 0,
      askingPrice: 0,
      images: []
    });
  }
  const threeProperties = displayProperties.slice(0, 3);

  const formatAddress = (property: Property): string => {
    if (!property.city && !property.county && !property.state) return '';
    
    let formatted = addressFormat;
    formatted = formatted.replace(/{county}/g, property.county || '');
    formatted = formatted.replace(/{city}/g, property.city || '');
    formatted = formatted.replace(/{state}/g, property.state || '');
    formatted = formatted.replace(/{zip}/g, property.zip || '');
    
    // Clean up extra commas and spaces
    return formatted
      .replace(/,\s*,/g, ',')
      .replace(/^,\s*/, '')
      .replace(/,\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const formatPrice = (property: Property): { main: string; sub?: string } => {
    const askingPrice = property.askingPrice || 0;
    const disPrice = property.disPrice || 0;
    const monthlyPayment = property.monthlyPayment || 0;
    const discount = askingPrice > 0 && disPrice > 0 ? askingPrice - disPrice : 0;

    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    const formatMonthly = (amount: number) => `$${amount.toLocaleString()}/mo`;

    switch (pricingStyle) {
      case 'askingPrice':
        return { main: formatCurrency(askingPrice) };
        
      case 'askingPriceWithPayment':
        return { 
          main: formatCurrency(askingPrice),
          sub: monthlyPayment > 0 ? formatMonthly(monthlyPayment) : undefined
        };
        
      case 'disPrice':
        return { main: formatCurrency(disPrice) };
        
      case 'disPriceWithPayment':
        return { 
          main: formatCurrency(disPrice),
          sub: monthlyPayment > 0 ? formatMonthly(monthlyPayment) : undefined
        };
        
      case 'discount':
        return { main: formatCurrency(discount) };
        
      case 'discountWithPayment':
        return { 
          main: formatCurrency(discount),
          sub: monthlyPayment > 0 ? formatMonthly(monthlyPayment) : undefined
        };
        
      default:
        return { main: formatCurrency(askingPrice) };
    }
  };

  const formatAcreage = (property: Property): string => {
    if (!property.acre) return '';
    return `${property.acre} Acre${property.acre !== 1 ? 's' : ''}`;
  };

  const containerStyle = {
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: showBorder ? '1px solid #e5e7eb' : 'none',
    padding: '20px',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    tableLayout: 'fixed' as const
  };

  const cellStyle = {
    width: '33.333%',
    padding: `0 ${propertySpacing / 2}px`,
    verticalAlign: 'top' as const,
    textAlign: 'center' as const
  };

  const imageStyle = {
    width: '100%',
    height: `${imageHeight}px`,
    objectFit: 'cover' as const,
    borderRadius: '8px',
    border: `3px solid ${primaryColor}`,
    display: 'block'
  };

  const addressStyle = {
    fontSize: '14px',
    color: textColor,
    fontWeight: '500',
    margin: '8px 0 4px 0',
    lineHeight: '1.4'
  };

  const acreageStyle = {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 8px 0'
  };

  const priceStyle = {
    fontSize: '18px',
    color: priceColor,
    fontWeight: 'bold',
    margin: '0'
  };

  const subPriceStyle = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '2px 0 0 0'
  };

  return (
    <Section
      className={className}
      style={{
        width: '100%',
        padding: '16px 0'
      }}
    >
      <div style={containerStyle}>
        <table style={tableStyle}>
          <tbody>
            <tr>
              {threeProperties.map((property, index) => {
                const address = formatAddress(property);
                const pricing = formatPrice(property);
                const acreage = formatAcreage(property);
                const imageUrl = property.images?.[0] || 'https://via.placeholder.com/300x200/e5e7eb/9ca3af?text=No+Image';
                
                // Skip rendering if this is an empty placeholder property
                if (!property.city && !property.county && !property.state && !property.askingPrice) {
                  return (
                    <td key={property.id} style={cellStyle}>
                      <div style={{ minHeight: `${imageHeight}px`, opacity: 0 }}>
                        {/* Empty placeholder to maintain layout */}
                      </div>
                    </td>
                  );
                }

                return (
                  <td key={property.id} style={cellStyle}>
                    {/* Property Image */}
                    <Img
                      src={imageUrl}
                      alt={`Property in ${property.city || 'Unknown Location'}`}
                      style={imageStyle}
                    />
                    
                    {/* Address */}
                    {address && (
                      <Text style={addressStyle}>
                        {address}
                      </Text>
                    )}
                    
                    {/* Acreage */}
                    {acreage && (
                      <Text style={acreageStyle}>
                        {acreage}
                      </Text>
                    )}
                    
                    {/* Main Price */}
                    <Text style={priceStyle}>
                      {pricing.main}
                    </Text>
                    
                    {/* Sub Price (monthly payment) */}
                    {pricing.sub && (
                      <Text style={subPriceStyle}>
                        {pricing.sub}
                      </Text>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const propertiesRowMetadata: EmailComponentMetadata = {
  type: 'properties-row',
  name: 'properties-row',
  displayName: 'Properties Row',
  version: 'v1.0',
  icon: <Grid className="w-5 h-5" />,
  description: 'Display three properties in a horizontal row with images, addresses, and pricing',
  category: 'content',
  available: true,
  defaultProps: {
    className: '',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    showBorder: false,
    properties: [],
    addressFormat: '{city}, {state} {zip}',
    pricingStyle: 'askingPrice',
    primaryColor: '#2563eb',
    textColor: '#374151',
    priceColor: '#059669',
    imageHeight: 200,
    propertySpacing: 16
  },
  configFields: [
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Background color of the properties section'
    },
    {
      key: 'primaryColor',
      label: 'Image Border Color',
      type: 'color',
      defaultValue: '#2563eb',
      description: 'Color of the border around property images'
    },
    {
      key: 'textColor',
      label: 'Text Color',
      type: 'color',
      defaultValue: '#374151',
      description: 'Color of address text'
    },
    {
      key: 'priceColor',
      label: 'Price Color',
      type: 'color',
      defaultValue: '#059669',
      description: 'Color of price text'
    },
    {
      key: 'addressFormat',
      label: 'Address Format',
      type: 'select',
      options: [
        { label: 'County Only', value: '{county}' },
        { label: 'City Only', value: '{city}' },
        { label: 'State Only', value: '{state}' },
        { label: 'State, Zip', value: '{state} {zip}' },
        { label: 'City, Zip', value: '{city} {zip}' },
        { label: 'County, State, Zip', value: '{county}, {state} {zip}' },
        { label: 'City, State, Zip', value: '{city}, {state} {zip}' },
        { label: 'Full Address', value: '{county}, {city}, {state} {zip}' }
      ],
      defaultValue: '{city}, {state} {zip}',
      description: 'Format for displaying property addresses'
    },
    {
      key: 'pricingStyle',
      label: 'Pricing Style',
      type: 'select',
      options: [
        { label: 'Asking Price', value: 'askingPrice' },
        { label: 'Asking Price + Monthly Payment', value: 'askingPriceWithPayment' },
        { label: 'Discounted Price', value: 'disPrice' },
        { label: 'Discounted Price + Monthly Payment', value: 'disPriceWithPayment' },
        { label: 'Discount Amount', value: 'discount' },
        { label: 'Discount Amount + Monthly Payment', value: 'discountWithPayment' }
      ],
      defaultValue: 'askingPrice',
      description: 'How to display property pricing'
    },
    {
      key: 'imageHeight',
      label: 'Image Height',
      type: 'number',
      defaultValue: 200,
      description: 'Height of property images in pixels'
    },
    {
      key: 'propertySpacing',
      label: 'Property Spacing',
      type: 'number',
      defaultValue: 16,
      description: 'Spacing between properties in pixels'
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
      label: 'Show Container Border',
      type: 'boolean',
      defaultValue: false,
      description: 'Display border around the entire component'
    },
    {
      key: 'className',
      label: 'CSS Classes',
      type: 'text',
      placeholder: 'Additional CSS classes',
      description: 'Add custom Tailwind classes for styling'
    }
  ],
  component: PropertiesRow
};

export default PropertiesRow;