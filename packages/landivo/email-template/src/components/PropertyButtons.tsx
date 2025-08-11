// packages/landivo/email-template/src/components/PropertyButtons.tsx
import React, { CSSProperties } from 'react';
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
  primaryButtonColor?: string;
  outlineButtonColor?: string;
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
  primaryButtonColor = '#2d5643',
  outlineButtonColor = '#2d5643',
}: PropertyButtonsProps) {

  // Property link - follows same pattern as PaymentCalculator and PropertyStatus
  const linkPropertyId = propertyId || (propertyData?.id) || '';
  const propertyLink = linkPropertyId ? `https://landivo.com/properties/${linkPropertyId}` : 'https://landivo.com/properties/';
  const inventoryLink = 'https://landivo.com/properties/';

  // Container styles with proper typing
  const containerStyle: CSSProperties = {
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: showBorder ? '1px solid #e5e7eb' : 'none',
    padding: `${spacing}px`,
    margin: '0 auto',
    maxWidth: '600px',
    width: '100%',
  };

  const buttonContainerStyle: CSSProperties = {
    width: '100%',
    marginBottom: '0',
    borderCollapse: 'separate' as const,
    borderSpacing: `0 ${buttonSpacing}px`,
  };

  const buttonCellStyle: CSSProperties = {
    width: '50%',
    verticalAlign: 'top' as const,
    padding: `0 ${buttonSpacing / 2}px`,
  };

  // Fixed button styles with proper TypeScript typing
  const outlineButtonStyle: CSSProperties = {
    backgroundColor: 'transparent',
    color: outlineButtonColor,
    border: `2px solid ${outlineButtonColor}`,
    borderRadius: '12px',
    padding: '16px 20px',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center' as const,
    width: '100%',
    boxSizing: 'border-box' as const, // Fixed: Added 'as const'
    transition: 'all 0.2s ease',
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };

  const primaryButtonStyle: CSSProperties = {
    backgroundColor: primaryButtonColor,
    color: '#ffffff',
    border: `2px solid ${primaryButtonColor}`,
    borderRadius: '12px',
    padding: '16px 20px',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center' as const,
    width: '100%',
    boxSizing: 'border-box' as const, // Fixed: Added 'as const'
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };

  const buttonMainTextStyle: CSSProperties = {
    fontSize: '16px',
    fontWeight: '600' as const,
    margin: '0 0 4px 0',
    lineHeight: '1.2',
    display: 'block',
  };

  const buttonSubTextStyle: CSSProperties = {
    fontSize: '13px',
    margin: '0',
    lineHeight: '1.2',
    opacity: '0.8',
    display: 'block',
  };

  const arrowStyle: CSSProperties = {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    marginLeft: '8px',
    display: 'inline',
  };

  // Hover styles for email compatibility
  const hoverStyles = `
    <style>
      .property-button-outline:hover {
        background-color: ${outlineButtonColor} !important;
        color: #ffffff !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(45, 86, 67, 0.15);
      }
      
      .property-button-primary:hover {
        background-color: ${primaryButtonColor}dd !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(45, 86, 67, 0.25);
      }
      
      @media (max-width: 600px) {
        .button-container td {
          width: 100% !important;
          display: block !important;
          padding: 8px 0 !important;
        }
        
        .button-table {
          width: 100% !important;
        }
      }
    </style>
  `;

  return (
    <Section className={className}>
      {/* Inject hover styles */}
      <div dangerouslySetInnerHTML={{ __html: hoverStyles }} />
      
      <div style={containerStyle}>
        {/* Two buttons side by side */}
        <table style={buttonContainerStyle} className="button-table">
          <tbody>
            <tr>
              {/* Left Button - Discounted Price (Outlined) */}
              <td style={buttonCellStyle} className="button-container">
                <Link 
                  href={propertyLink} 
                  style={outlineButtonStyle}
                  className="property-button-outline"
                >
                  <Text style={buttonMainTextStyle}>
                    See Discounted Price
                  </Text>
                  <Text style={buttonSubTextStyle}>
                    Exclusive deals available
                  </Text>
                </Link>
              </td>

              {/* Right Button - Our Inventory (Primary) */}
              <td style={buttonCellStyle} className="button-container">
                <Link 
                  href={inventoryLink} 
                  style={primaryButtonStyle}
                  className="property-button-primary"
                >
                  <Text style={buttonMainTextStyle}>
                    Our Inventory
                    <span style={arrowStyle}>→</span>
                  </Text>
                  <Text style={buttonSubTextStyle}>
                    Browse all properties
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

// Enhanced metadata with additional configuration options
export const propertyButtonsMetadata: EmailComponentMetadata = {
  type: 'property-buttons',
  name: 'property-buttons',
  displayName: 'Property Buttons',
  version: 'v1.0',
  icon: <Zap className="w-5 h-5" />,
  category: 'content',
  description: 'Call-to-action buttons for property engagement - discounted pricing and inventory browsing',
  available: true,
  defaultProps: {
    className: '',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    showBorder: true,
    spacing: 20,
    buttonSpacing: 12,
    primaryButtonColor: '#2d5643',
    outlineButtonColor: '#2d5643',
    propertyId: ''
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