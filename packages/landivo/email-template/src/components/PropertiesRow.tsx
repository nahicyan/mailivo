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
  acreageColor?: string;
  monthlyPaymentColor?: string;
  imageHeight?: number;
  propertySpacing?: number;
  // Font sizes
  addressFontSize?: number;
  acreageFontSize?: number;
  priceFontSize?: number;
  monthlyPaymentFontSize?: number;
  crossedOutFontSize?: number;
  // Template builder props
  propertyData?: any;
  selectedProperty?: any;
}

interface Property {
  id: string;
  images?: string[];
  imageUrls?: string[];
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
  title?: string;
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
  acreageColor = '#6b7280',
  monthlyPaymentColor = '#6b7280',
  imageHeight = 200,
  propertySpacing = 16,
  // Font sizes
  addressFontSize = 14,
  acreageFontSize = 14,
  priceFontSize = 18,
  monthlyPaymentFontSize = 14,
  crossedOutFontSize = 14,
  // Template builder props
  propertyData,
  selectedProperty
}: PropertiesRowProps) {

  // Use selectedProperty or propertyData from template builder if available
  const templateProperty = selectedProperty || propertyData;
  
  // Create demo properties - for template builder preview, duplicate the selected property
  const getDisplayProperties = (): Property[] => {
    if (templateProperty) {
      // Parse imageUrls if it's a string
      let imageUrls: string[] = [];
      try {
        imageUrls = typeof templateProperty.imageUrls === 'string' 
          ? JSON.parse(templateProperty.imageUrls)
          : templateProperty.imageUrls || [];
      } catch {
        imageUrls = [];
      }

      const propertyForDisplay: Property = {
        id: templateProperty.id || '1',
        images: imageUrls,
        imageUrls: imageUrls,
        county: templateProperty.county || '',
        city: templateProperty.city || '',
        state: templateProperty.state || '',
        zip: templateProperty.zip || '',
        streetAddress: templateProperty.streetAddress || '',
        acre: templateProperty.acre || 0,
        askingPrice: templateProperty.askingPrice || 0,
        disPrice: templateProperty.disPrice || 0,
        minPrice: templateProperty.minPrice || 0,
        monthlyPayment: templateProperty.monthlyPayment || 299,
        title: templateProperty.title || ''
      };

      // Return 3 copies for demonstration (with slight variations)
      return [
        propertyForDisplay,
        {
          ...propertyForDisplay,
          id: '2',
          city: propertyForDisplay.city || 'Austin',
          askingPrice: (propertyForDisplay.askingPrice || 100000) + 50000,
          monthlyPayment: (propertyForDisplay.monthlyPayment || 299) + 100
        },
        {
          ...propertyForDisplay,
          id: '3',
          city: propertyForDisplay.city || 'Houston', 
          askingPrice: (propertyForDisplay.askingPrice || 100000) + 25000,
          monthlyPayment: (propertyForDisplay.monthlyPayment || 299) + 50
        }
      ];
    }

    // Fallback demo properties when no property is selected
    if (properties.length > 0) {
      return properties.slice(0, 3);
    }

    // Default demo properties for preview
    return [
      {
        id: 'demo1',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        county: 'Dallas',
        askingPrice: 150000,
        disPrice: 140000,
        monthlyPayment: 299,
        acre: 0.5,
        images: ['https://via.placeholder.com/300x200/3b82f6/ffffff?text=Property+1'],
        imageUrls: ['https://via.placeholder.com/300x200/3b82f6/ffffff?text=Property+1']
      },
      {
        id: 'demo2',
        city: 'Austin',
        state: 'TX', 
        zip: '78701',
        county: 'Travis',
        askingPrice: 200000,
        disPrice: 190000,
        monthlyPayment: 399,
        acre: 0.75,
        images: ['https://via.placeholder.com/300x200/10b981/ffffff?text=Property+2'],
        imageUrls: ['https://via.placeholder.com/300x200/10b981/ffffff?text=Property+2']
      },
      {
        id: 'demo3',
        city: 'Houston',
        state: 'TX',
        zip: '77001', 
        county: 'Harris',
        askingPrice: 175000,
        disPrice: 165000,
        monthlyPayment: 349,
        acre: 0.6,
        images: ['https://via.placeholder.com/300x200/f59e0b/ffffff?text=Property+3'],
        imageUrls: ['https://via.placeholder.com/300x200/f59e0b/ffffff?text=Property+3']
      }
    ];
  };

  const displayProperties = getDisplayProperties();

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

  const formatPrice = (property: Property): { main: string; sub?: string; crossedOut?: string } => {
    const askingPrice = property.askingPrice || 0;
    const disPrice = property.disPrice || 0;
    const monthlyPayment = property.monthlyPayment || 0;
    const discount = askingPrice > 0 && disPrice > 0 ? askingPrice - disPrice : 0;

    const formatCurrency = (amount: number) => `${amount.toLocaleString()}`;
    const formatMonthly = (amount: number) => `${amount.toLocaleString()}/mo`;

    switch (pricingStyle) {
      case 'askingPrice':
        return { main: formatCurrency(askingPrice) };
        
      case 'askingPriceWithPayment':
        return { 
          main: formatCurrency(askingPrice),
          sub: monthlyPayment > 0 ? formatMonthly(monthlyPayment) : undefined
        };
        
      case 'disPrice':
        return { 
          crossedOut: formatCurrency(askingPrice),
          main: formatCurrency(disPrice) 
        };
        
      case 'disPriceWithPayment':
        return { 
          crossedOut: formatCurrency(askingPrice),
          main: formatCurrency(disPrice),
          sub: monthlyPayment > 0 ? formatMonthly(monthlyPayment) : undefined
        };
        
      case 'discount':
        return { main: `${formatCurrency(discount)} Off` };
        
      case 'discountWithPayment':
        return { 
          main: `${formatCurrency(discount)} Off`,
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
    fontSize: `${addressFontSize}px`,
    color: textColor,
    fontWeight: '500',
    margin: '8px 0 4px 0',
    lineHeight: '1.4'
  };

  const acreageStyle = {
    fontSize: `${acreageFontSize}px`,
    color: acreageColor,
    margin: '0 0 8px 0',
    fontWeight: '500'
  };

  const priceStyle = {
    fontSize: `${priceFontSize}px`,
    color: priceColor,
    fontWeight: 'bold',
    margin: '0'
  };

  const crossedOutStyle = {
    fontSize: `${crossedOutFontSize}px`,
    color: '#9ca3af',
    textDecoration: 'line-through',
    margin: '0 0 2px 0'
  };

  const subPriceStyle = {
    fontSize: `${monthlyPaymentFontSize}px`,
    color: monthlyPaymentColor,
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
              {displayProperties.map((property, index) => {
                const address = formatAddress(property);
                const pricing = formatPrice(property);
                const acreage = formatAcreage(property);
                
                // Get image URL - try multiple sources
                const imageUrl = property.images?.[0] || property.imageUrls?.[0] || 
                  `https://via.placeholder.com/300x${imageHeight}/e5e7eb/9ca3af?text=No+Image`;

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
                    
                    {/* Pricing Section */}
                    <div>
                      {/* Crossed Out Price (for discounted pricing) */}
                      {pricing.crossedOut && (
                        <Text style={crossedOutStyle}>
                          {pricing.crossedOut}
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
                    </div>
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
    acreageColor: '#6b7280',
    monthlyPaymentColor: '#6b7280',
    imageHeight: 200,
    propertySpacing: 16,
    addressFontSize: 14,
    acreageFontSize: 14,
    priceFontSize: 18,
    monthlyPaymentFontSize: 14,
    crossedOutFontSize: 14
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
      key: 'acreageColor',
      label: 'Acreage Color',
      type: 'color',
      defaultValue: '#6b7280',
      description: 'Color of acreage text'
    },
    {
      key: 'monthlyPaymentColor',
      label: 'Monthly Payment Color',
      type: 'color',
      defaultValue: '#6b7280',
      description: 'Color of monthly payment text'
    },
    {
      key: 'addressFontSize',
      label: 'Address Font Size',
      type: 'number',
      defaultValue: 14,
      description: 'Font size of address text in pixels'
    },
    {
      key: 'acreageFontSize',
      label: 'Acreage Font Size',
      type: 'number',
      defaultValue: 14,
      description: 'Font size of acreage text in pixels'
    },
    {
      key: 'priceFontSize',
      label: 'Price Font Size',
      type: 'number',
      defaultValue: 18,
      description: 'Font size of main price text in pixels'
    },
    {
      key: 'monthlyPaymentFontSize',
      label: 'Monthly Payment Font Size',
      type: 'number',
      defaultValue: 14,
      description: 'Font size of monthly payment text in pixels'
    },
    {
      key: 'crossedOutFontSize',
      label: 'Crossed Out Price Font Size',
      type: 'number',
      defaultValue: 14,
      description: 'Font size of crossed out price text in pixels'
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