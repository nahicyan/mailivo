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
  // Template builder props (fallback for single property preview)
  propertyData?: any;
  selectedProperty?: any;
  // Context flag to differentiate email vs preview
  isEmailContext?: boolean;
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
  selectedImageIndex?: number;
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
  // Template builder props (fallback)
  propertyData,
  selectedProperty,
  isEmailContext = false
}: PropertiesRowProps) {

  // Use selectedProperty or propertyData from template builder if available
  const templateProperty = selectedProperty || propertyData;
  
  // Create demo properties - for template builder preview, duplicate the selected property
  const getDisplayProperties = (): Property[] => {
    // If we have actual properties from multi-property campaign
    if (properties.length > 0) {
      // In email context, show all properties. In preview, limit to 3
      return isEmailContext ? properties : properties.slice(0, 3);
    }

    // If we have a template property (from template builder), use it for demo
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

  // Helper function to chunk properties into groups of 3 for multiple rows
  const chunkProperties = (props: Property[], chunkSize: number = 3): Property[][] => {
    const chunks: Property[][] = [];
    for (let i = 0; i < props.length; i += chunkSize) {
      chunks.push(props.slice(i, i + chunkSize));
    }
    return chunks;
  };

  // Format address based on addressFormat template
  const formatAddress = (property: Property): string => {
    let formatted = addressFormat;
    
    formatted = formatted.replace('{county}', property.county || '');
    formatted = formatted.replace('{city}', property.city || '');
    formatted = formatted.replace('{state}', property.state || '');
    formatted = formatted.replace('{zip}', property.zip || '');
    
    // Clean up extra spaces and commas
    formatted = formatted.replace(/,\s*,/g, ',').replace(/,\s*$/, '').replace(/^\s*,/, '');
    return formatted.trim();
  };

  // Get property image URL
  const getPropertyImageUrl = (property: Property): string => {
    const imageUrls = property.images || property.imageUrls || [];
    const selectedIndex = property.selectedImageIndex || 0;
    
    if (imageUrls.length > selectedIndex) {
      return imageUrls[selectedIndex];
    } else if (imageUrls.length > 0) {
      return imageUrls[0];
    }
    
    // Fallback placeholder
    return `https://via.placeholder.com/300x${imageHeight}/d1d5db/6b7280?text=No+Image`;
  };

  // Format pricing based on pricingStyle
  const formatPricing = (property: Property): { main: string; secondary?: string; crossedOut?: string } => {
    const askingPrice = property.askingPrice || 0;
    const disPrice = property.disPrice || askingPrice;
    const monthlyPayment = property.monthlyPayment || 0;
    const discount = askingPrice - disPrice;

    switch (pricingStyle) {
      case 'askingPrice':
        return { main: `$${askingPrice.toLocaleString()}` };
      
      case 'askingPriceWithPayment':
        return {
          main: `$${askingPrice.toLocaleString()}`,
          secondary: monthlyPayment > 0 ? `or $${monthlyPayment}/mo` : undefined
        };
      
      case 'disPrice':
        return { main: `$${disPrice.toLocaleString()}` };
      
      case 'disPriceWithPayment':
        return {
          main: `$${disPrice.toLocaleString()}`,
          secondary: monthlyPayment > 0 ? `or $${monthlyPayment}/mo` : undefined
        };
      
      case 'discount':
        return { main: discount > 0 ? `Save $${discount.toLocaleString()}!` : `$${askingPrice.toLocaleString()}` };
      
      case 'discountWithPayment':
        return {
          main: discount > 0 ? `Save $${discount.toLocaleString()}!` : `$${askingPrice.toLocaleString()}`,
          secondary: monthlyPayment > 0 ? `or $${monthlyPayment}/mo` : undefined,
          crossedOut: discount > 0 ? `$${askingPrice.toLocaleString()}` : undefined
        };
      
      default:
        return { main: `$${askingPrice.toLocaleString()}` };
    }
  };

  if (displayProperties.length === 0) {
    return (
      <Section style={{ padding: '16px', textAlign: 'center' }}>
        <Text style={{ color: '#6b7280', fontStyle: 'italic' }}>
          No properties to display
        </Text>
      </Section>
    );
  }

  // Chunk properties into rows of 3
  const propertyRows = chunkProperties(displayProperties, 3);

  return (
    <Section 
      className={className}
      style={{
        backgroundColor,
        borderRadius: showBorder ? borderRadius : 0,
        border: showBorder ? '1px solid #e5e7eb' : 'none',
        padding: '20px',
        margin: '0'
      }}
    >
      <div style={{
        maxWidth: '600px',
        width: '100%',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif'
      }}>
        {propertyRows.map((propertiesInRow, rowIndex) => (
          <div key={`row-${rowIndex}`} style={{ 
            marginBottom: rowIndex < propertyRows.length - 1 ? `${propertySpacing}px` : '0',
            textAlign: 'center'
          }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                margin: '0'
              }}
            >
            <tbody>
              <tr>
                {propertiesInRow.map((property, index) => {
                  const pricing = formatPricing(property);
                  const address = formatAddress(property);
                  const imageUrl = getPropertyImageUrl(property);

                  return (
                    <td
                      key={property.id || index}
                      style={{
                        width: '33.333%', // Fixed width for consistency
                        verticalAlign: 'top',
                        padding: `0 ${propertySpacing / 2}px`,
                        textAlign: 'center'
                      }}
                    >
                      {/* Property Image */}
                      <div style={{ marginBottom: '12px' }}>
                        <Img
                          src={imageUrl}
                          alt={property.title || `Property ${index + 1}`}
                          style={{
                            width: '100%',
                            maxWidth: '100%',
                            height: `${imageHeight}px`,
                            objectFit: 'cover',
                            borderRadius: `${borderRadius}px`,
                            border: `2px solid ${primaryColor}`,
                            display: 'block'
                          }}
                        />
                      </div>

                      {/* Property Address */}
                      <Text style={{
                        fontSize: `${addressFontSize}px`,
                        color: textColor,
                        fontWeight: '500',
                        margin: '0 0 8px 0',
                        lineHeight: '1.3',
                        textAlign: 'center'
                      }}>
                        {address}
                      </Text>

                      {/* Property Acreage */}
                      {property.acre && (
                        <Text style={{
                          fontSize: `${acreageFontSize}px`,
                          color: acreageColor,
                          margin: '0 0 8px 0',
                          textAlign: 'center'
                        }}>
                          {property.acre} acres
                        </Text>
                      )}

                      {/* Crossed-out Price */}
                      {pricing.crossedOut && (
                        <Text style={{
                          fontSize: `${crossedOutFontSize}px`,
                          color: '#9ca3af',
                          textDecoration: 'line-through',
                          margin: '0 0 4px 0',
                          textAlign: 'center'
                        }}>
                          {pricing.crossedOut}
                        </Text>
                      )}

                      {/* Main Price */}
                      <Text style={{
                        fontSize: `${priceFontSize}px`,
                        color: priceColor,
                        fontWeight: 'bold',
                        margin: '0 0 4px 0',
                        textAlign: 'center'
                      }}>
                        {pricing.main}
                      </Text>

                      {/* Monthly Payment */}
                      {pricing.secondary && (
                        <Text style={{
                          fontSize: `${monthlyPaymentFontSize}px`,
                          color: monthlyPaymentColor,
                          margin: '0',
                          textAlign: 'center'
                        }}>
                          {pricing.secondary}
                        </Text>
                      )}
                    </td>
                  );
                })}
                
                {/* Fill empty columns if row has less than 3 properties */}
                {propertiesInRow.length < 3 && Array.from({ length: 3 - propertiesInRow.length }).map((_, emptyIndex) => (
                  <td key={`empty-${emptyIndex}`} style={{
                    width: '33.333%',
                    padding: '0'
                  }}></td>
                ))}
              </tr>
            </tbody>
          </table>
          </div>
        ))}
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
  description: 'Display multiple properties in a horizontal row with images, addresses, and pricing. In emails, shows all properties with wrapping.',
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
    crossedOutFontSize: 14,
    isEmailContext: false
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
      key: 'addressFormat',
      label: 'Address Format',
      type: 'select',
      options: [
        { label: 'County Only', value: '{county}' },
        { label: 'City Only', value: '{city}' },
        { label: 'State Only', value: '{state}' },
        { label: 'State + ZIP', value: '{state} {zip}' },
        { label: 'City + ZIP', value: '{city} {zip}' },
        { label: 'County, State + ZIP', value: '{county}, {state} {zip}' },
        { label: 'City, State + ZIP', value: '{city}, {state} {zip}' },
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
      key: 'addressFontSize',
      label: 'Address Font Size',
      type: 'number',
      defaultValue: 14,
      description: 'Font size for address text in pixels'
    },
    {
      key: 'acreageFontSize',
      label: 'Acreage Font Size',
      type: 'number',
      defaultValue: 14,
      description: 'Font size for acreage text in pixels'
    },
    {
      key: 'priceFontSize',
      label: 'Price Font Size',
      type: 'number',
      defaultValue: 18,
      description: 'Font size for price text in pixels'
    },
    {
      key: 'monthlyPaymentFontSize',
      label: 'Monthly Payment Font Size',
      type: 'number',
      defaultValue: 14,
      description: 'Font size for monthly payment text in pixels'
    },
    {
      key: 'crossedOutFontSize',
      label: 'Crossed Out Font Size',
      type: 'number',
      defaultValue: 14,
      description: 'Font size for crossed out price text in pixels'
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