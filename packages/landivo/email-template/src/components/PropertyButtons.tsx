// packages/landivo/email-template/src/components/PropertyButtons.tsx
import React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { Zap } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface PropertyButtonsProps {
  className?: string;
  backgroundColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  spacing?: number;
  propertyData?: any;
  propertyId?: string;
  buttonSpacing?: number;
}

export function PropertyButtons({
  className = '',
  backgroundColor = '#f8f9fa',
  borderRadius = 8,
  showBorder = true,
  spacing = 20,
  propertyData,
  propertyId = '',
  buttonSpacing = 12,
}: PropertyButtonsProps) {

  // Property link - follows same pattern as PaymentCalculator and PropertyStatus
  const linkPropertyId = propertyId || (propertyData?.id) || '';
  const propertyLink = linkPropertyId ? `https://landivo.com/properties/${linkPropertyId}` : 'https://landivo.com/properties/';
  const inventoryLink = 'https://landivo.com/properties/';

  const containerStyle = {
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: showBorder ? '1px solid #e5e7eb' : 'none',
    padding: `${spacing}px`,
    margin: '0 auto',
    maxWidth: '600px',
    width: '100%',
  };

  const buttonContainerStyle = {
    width: '100%',
    marginBottom: '0',
  };

  const buttonCellStyle = {
    width: '50%',
    verticalAlign: 'top',
    padding: `0 ${buttonSpacing / 2}px`,
  };

  const outlineButtonStyle = {
    backgroundColor: 'transparent',
    color: '#2d5643',
    border: `2px solid #2d5643`,
    borderRadius: '12px',
    padding: '16px 20px',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center' as const,
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  };

  const primaryButtonStyle = {
    backgroundColor: '#2d5643',
    color: '#ffffff',
    border: `2px solid #2d5643`,
    borderRadius: '12px',
    padding: '16px 20px',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center' as const,
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
  };

  const buttonMainTextStyle = {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    lineHeight: '1.2',
    display: 'block',
  };

  const buttonSubTextStyle = {
    fontSize: '13px',
    margin: '0',
    lineHeight: '1.2',
    opacity: '0.8',
    display: 'block',
  };

  const arrowStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    marginLeft: '8px',
    display: 'inline',
  };

  return (
    <Section className={className}>
      <div style={containerStyle}>
        {/* Two buttons side by side */}
        <table style={buttonContainerStyle}>
          <tbody>
            <tr>
              {/* Left Button - Discounted Price (Outlined) */}
              <td style={buttonCellStyle}>
                <Link href={propertyLink} style={outlineButtonStyle}>
                  <Text style={{...buttonMainTextStyle, color:'#2d5643'}}>
                    Discounted Price
                  </Text>
                  <Text style={{...buttonSubTextStyle, color:'#2d5643'}}>
                    Check latest Price
                  </Text>
                </Link>
              </td>

              {/* Right Button - Our Inventory (Primary) */}
              <td style={buttonCellStyle}>
                <Link href={inventoryLink} style={primaryButtonStyle}>
                  <Text style={{...buttonMainTextStyle, color: '#ffffff'}}>
                    Our Inventory
                    <span style={arrowStyle}>→</span>
                  </Text>
                  <Text style={{...buttonSubTextStyle, color: '#ffffff'}}>
                    All of Our Lands
                  </Text>
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const propertyButtonsMetadata: EmailComponentMetadata = {
  type: 'property-buttons',
  name: 'property-buttons',
  displayName: 'Property Buttons',
  version: 'v1.0',
  icon: <Zap className="w-5 h-5" />,
  description: 'Display property action buttons for pricing and inventory access',
  category: 'content',
  available: true,
  defaultProps: {
    className: '',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    showBorder: true,
    spacing: 20,
    buttonSpacing: 12,
    primaryButtonColor: '#2d5643',
    outlineButtonColor: '#2d5643'
  },
  configFields: [
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#f8f9fa',
      description: 'Background color of the buttons section'
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
      key: 'spacing',
      label: 'Container Padding',
      type: 'number',
      defaultValue: 20,
      description: 'Internal padding of the container in pixels'
    },
    {
      key: 'buttonSpacing',
      label: 'Button Spacing',
      type: 'number',
      defaultValue: 12,
      description: 'Space between the two buttons in pixels'
    },
    {
      key: 'primaryButtonColor',
      label: 'Primary Button Color',
      type: 'color',
      defaultValue: '#2d5643',
      description: 'Background color of the primary (Our Inventory) button'
    },
    {
      key: 'outlineButtonColor',
      label: 'Outline Button Color',
      type: 'color',
      defaultValue: '#2d5643',
      description: 'Border and text color of the outline (Discounted Price) button'
    },
    {
      key: 'propertyId',
      label: 'Property ID',
      type: 'text',
      placeholder: 'property-123',
      description: 'ID for linking to specific property details page'
    },
    {
      key: 'className',
      label: 'CSS Classes',
      type: 'text',
      placeholder: 'Additional CSS classes',
      description: 'Add custom Tailwind classes for styling'
    }
  ],
  component: PropertyButtons
};

export default PropertyButtons;