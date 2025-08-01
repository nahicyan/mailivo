// packages/landivo/email-template/src/components/PropertyStatus.tsx
import React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface PropertyStatusProps {
  className?: string;
  status?: 'Available' | 'Pending' | 'Not Available' | 'Sold' | 'Testing';
  propertyId?: string;
  buttonText?: string;
  showIcon?: boolean;
  badgeStyle?: 'default' | 'rounded' | 'pill';
  buttonStyle?: 'primary' | 'secondary' | 'outline';
  propertyData?: any;
}

export function PropertyStatus({
  className = '',
  status = 'Available',
  propertyId = '',
  buttonText = 'View Details and Pricing',
  showIcon = false,
  badgeStyle = 'default',
  buttonStyle = 'primary',
  propertyData
}: PropertyStatusProps) {
  
  
  const getStatusClasses = (status: string) => {
    switch (status) {
      case "Available":
        return { circle: "#10b981", text: "#065f46", bg: "#d1fae5", border: "#10b981" };
      case "Pending":
        return { circle: "#eab308", text: "#92400e", bg: "#fef3c7", border: "#eab308" };
      case "Not Available":
      case "Sold":
        return { circle: "#ef4444", text: "#991b1b", bg: "#fee2e2", border: "#ef4444" };
      case "Testing":
        return { circle: "#3b82f6", text: "#1e40af", bg: "#dbeafe", border: "#3b82f6" };
      default:
        return { circle: "#9ca3af", text: "#374151", bg: "#f3f4f6", border: "#9ca3af" };
    }
  };

  const getButtonStyles = (buttonStyle: string) => {
    switch (buttonStyle) {
      case 'primary':
        return {
          backgroundColor: '#059669',
          color: '#ffffff',
          border: '2px solid #059669',
          borderRadius: '6px',
          padding: '10px 20px',
          textDecoration: 'none',
          display: 'inline-block',
          fontSize: '14px',
          fontWeight: '600',
          textAlign: 'center' as const,
          transition: 'all 0.2s',
        };
      case 'secondary':
        return {
          backgroundColor: '#6b7280',
          color: '#ffffff',
          border: '2px solid #6b7280',
          borderRadius: '6px',
          padding: '10px 20px',
          textDecoration: 'none',
          display: 'inline-block',
          fontSize: '14px',
          fontWeight: '600',
          textAlign: 'center' as const,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: '#059669',
          border: '2px solid #059669',
          borderRadius: '6px',
          padding: '10px 20px',
          textDecoration: 'none',
          display: 'inline-block',
          fontSize: '14px',
          fontWeight: '600',
          textAlign: 'center' as const,
        };
      default:
        return {
          backgroundColor: '#059669',
          color: '#ffffff',
          border: '2px solid #059669',
          borderRadius: '6px',
          padding: '10px 20px',
          textDecoration: 'none',
          display: 'inline-block',
          fontSize: '14px',
          fontWeight: '600',
          textAlign: 'center' as const,
        };
    }
  };

  const getBadgeRadius = (badgeStyle: string) => {
    switch (badgeStyle) {
      case 'rounded':
        return '8px';
      case 'pill':
        return '50px';
      default:
        return '4px';
    }
  };

  // Use propertyId from props or extract from propertyData
  const linkPropertyId = propertyId || propertyData?.id || '';
  // Use status from property data first, fallback to prop
  const actualStatus = propertyData?.status || status;
  const statusDisplayText = actualStatus;

  const statusClasses = getStatusClasses(actualStatus);
  const buttonStyles = getButtonStyles(buttonStyle);
  const badgeRadius = getBadgeRadius(badgeStyle);

  return (
    <Section
      className={`w-full py-4 ${className}`}
      style={{
        width: '100%',
        padding: '16px 0',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0 20px',
        position: 'relative',
      }}>
        {/* Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '18px',
          fontWeight: '500',
          color: statusClasses.text,
          border: `1px solid ${statusClasses.circle}`,
          borderRadius: '20px',
          padding: '8px 12px',
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: statusClasses.circle,
            borderRadius: '50%',
            marginRight: '8px',
            border: `1px solid ${statusClasses.circle}`,
            alignSelf: 'center',
            flexShrink: 0,
          }}></div>
          <span style={{ lineHeight: '1' }}>{statusDisplayText}</span>
        </div>

        {/* CTA Button */}
        <Link
          href={`https://landivo.com/properties/${linkPropertyId}`}
          style={{
            ...buttonStyles,
            marginLeft: 'auto',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span>{buttonText}</span>
            <ExternalLink style={{ width: '16px', height: '16px' }} />
          </div>
        </Link>
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const propertyStatusMetadata: EmailComponentMetadata = {
  type: 'property-status',
  name: 'property-status',
  displayName: 'Property Status',
  version: 'v1.0',
  icon: <CheckCircle className="w-5 h-5" />,
  description: 'Display property status with action button',
  category: 'content',
  available: true,
  defaultProps: {
    className: '',
    status: 'Available',
    propertyId: '',
    buttonText: 'View Details and Pricing',
    showIcon: false,
    badgeStyle: 'default',
    buttonStyle: 'primary'
  },
  configFields: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Available', value: 'Available' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Not Available', value: 'Not Available' },
        { label: 'Sold', value: 'Sold' },
        { label: 'Testing', value: 'Testing' }
      ],
      defaultValue: 'Available',
      description: 'Current status of the property'
    },
    {
      key: 'propertyId',
      label: 'Property ID',
      type: 'text',
      placeholder: 'property-123',
      description: 'ID for linking to property details page'
    },
    {
      key: 'buttonText',
      label: 'Button Text',
      type: 'text',
      placeholder: 'View Details and Pricing',
      defaultValue: 'View Details and Pricing',
      description: 'Text displayed on the action button'
    },
    {
      key: 'showIcon',
      label: 'Show Status Icon',
      type: 'toggle',
      defaultValue: true,
      description: 'Display icon next to status text'
    },
    {
      key: 'badgeStyle',
      label: 'Badge Style',
      type: 'select',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Rounded', value: 'rounded' },
        { label: 'Pill', value: 'pill' }
      ],
      defaultValue: 'default',
      description: 'Visual style of the status badge'
    },
    {
      key: 'buttonStyle',
      label: 'Button Style',
      type: 'select',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Outline', value: 'outline' }
      ],
      defaultValue: 'primary',
      description: 'Visual style of the action button'
    },
    {
      key: 'className',
      label: 'CSS Classes',
      type: 'text',
      placeholder: 'Additional CSS classes',
      description: 'Add custom Tailwind classes for styling'
    }
  ],
  component: PropertyStatus
};