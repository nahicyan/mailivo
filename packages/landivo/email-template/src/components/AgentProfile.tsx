// packages/landivo/email-template/src/components/AgentProfile.tsx
import React from 'react';
import { Section, Text, Img, Link, Button, Row, Column } from '@react-email/components';
import { User } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface AgentData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  profileRole?: string;
  avatarUrl?: string;
}

interface AgentProfileProps {
  className?: string;
  backgroundColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  showProfileImage?: boolean;
  overridePhone?: string;
  overrideEmail?: string;
  agentData?: AgentData;
  style?: 'modern' | 'classic' | 'minimal';
  alignment?: 'left' | 'center' | 'right';
  propertyData?: any;
  contactData?: any;
}

export function AgentProfile({
  className = '',
  backgroundColor = '#f8f9fa',
  borderRadius = 12,
  showBorder = true,
  showProfileImage = true,
  overridePhone,
  overrideEmail,
  agentData,
  style = 'modern',
  alignment = 'left',
  propertyData,
  contactData
}: AgentProfileProps) {

  // Use override values or fall back to agent data
  const displayPhone = overridePhone || agentData?.phone || '';
  const displayEmail = overrideEmail || agentData?.email || '';
  const firstName = agentData?.firstName || '';
  const lastName = agentData?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Agent';
  const profileRole = agentData?.profileRole || 'Real Estate Agent';
  
  // Process avatar URL
  let avatarUrl = '';
  if (agentData?.avatarUrl) {
    avatarUrl = agentData.avatarUrl.startsWith('http') 
      ? agentData.avatarUrl 
      : `https://api.landivo.com/${agentData.avatarUrl}`;
  }

  // Style variations
  const getStyleConfig = () => {
    switch (style) {
      case 'classic':
        return {
          containerPadding: '24px',
          borderColor: '#e5e7eb',
          shadowStyle: 'none',
          nameColor: '#1f2937',
          roleColor: '#6b7280',
          phoneColor: '#2a5e56',
          emailColor: '#6f7788ff',
          nameSize: '20px',
          roleSize: '14px',
          buttonBg: '#059669',
          avatarSize: '72'
        };
      case 'minimal':
        return {
          containerPadding: '16px',
          borderColor: 'transparent',
          shadowStyle: 'none',
          nameColor: '#374151',
          roleColor: '#9ca3af',
          phoneColor: '#2a5e56',
          emailColor: '#6f7788ff',
          nameSize: '18px',
          roleSize: '13px',
          buttonBg: '#059669',
          avatarSize: '64'
        };
      default: // modern
        return {
          containerPadding: '20px',
          borderColor: '#e5e7eb',
          shadowStyle: '0 2px 8px rgba(0, 0, 0, 0.08)',
          nameColor: '#111827',
          roleColor: '#6b7280',
          phoneColor: '#2a5e56',
          emailColor: '#6f7788ff',
          nameSize: '19px',
          roleSize: '14px',
          buttonBg: '#059669',
          avatarSize: '80'
        };
    }
  };

  const styleConfig = getStyleConfig();

  // Build mailto link with proper encoding
  const mailtoSubject = encodeURIComponent('Property Inquiry');
  const mailtoBody = encodeURIComponent(
    `Hi ${firstName || 'there'},\n\nI'm interested in learning more about the property you have listed.\n\nBest regards`
  );
  const mailtoLink = `mailto:${displayEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  // Format phone for tel link
  const telLink = `tel:${displayPhone.replace(/\D/g, '')}`;

  const containerStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: showBorder ? `1px solid ${styleConfig.borderColor}` : 'none',
    boxShadow: styleConfig.shadowStyle,
    padding: styleConfig.containerPadding,
    overflow: 'hidden'
  };

  const tableStyle = {
    width: '100%',
    borderSpacing: '0',
    borderCollapse: 'collapse' as const
  };

  const avatarCellStyle = {
    verticalAlign: 'middle' as const,
    width: styleConfig.avatarSize,
    paddingRight: '20px'
  };

  const avatarContainerStyle = {
    width: `${styleConfig.avatarSize}px`,
    height: `${styleConfig.avatarSize}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    border: `3px solid ${styleConfig.borderColor}`,
    backgroundColor: '#f3f4f6',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  const avatarPlaceholderStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
    fontSize: '32px',
    fontFamily: 'Arial, sans-serif'
  };

  const detailsCellStyle = {
    verticalAlign: 'middle' as const,
    paddingRight: '20px',
    width: 'auto'
  };

  const nameStyle = {
    fontSize: styleConfig.nameSize,
    lineHeight: '1.3',
    margin: '0 0 2px 0',
    fontWeight: '600',
    color: styleConfig.nameColor,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const roleStyle = {
    margin: '0',
    fontSize: styleConfig.roleSize,
    color: styleConfig.roleColor,
    fontStyle: 'italic',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const phoneLinkStyle = {
    color: styleConfig.phoneColor,
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    display: 'inline-block',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const emailLinkStyle = {
    color: styleConfig.emailColor,
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '500',
    display: 'inline-block',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const buttonCellStyle = {
    verticalAlign: 'middle' as const,
    width: '160px',
    textAlign: 'right' as const
  };

  const buttonStyle = {
    display: 'inline-block',
    backgroundColor: styleConfig.buttonBg,
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '600',
    textAlign: 'center' as const,
    border: 'none',
    lineHeight: '1.2',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
    cursor: 'pointer'
  };

  return (
    <Section className={className} style={{ width: '100%', padding: '20px 0' }}>
      <div style={containerStyle}>
        <table style={tableStyle}>
          <tbody>
            <tr>
              {/* Profile Image Column */}
              {showProfileImage && (
                <td style={avatarCellStyle}>
                  <div style={avatarContainerStyle}>
                    {avatarUrl ? (
                      <Img
                        src={avatarUrl}
                        alt={fullName}
                        width={styleConfig.avatarSize}
                        height={styleConfig.avatarSize}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <div style={avatarPlaceholderStyle}>
                        👤
                      </div>
                    )}
                  </div>
                </td>
              )}

              {/* Agent Details Column */}
              <td style={detailsCellStyle}>
                {/* Name and Role */}
                <div style={{ marginBottom: '8px' }}>
                  <Text style={nameStyle}>
                    {fullName}
                  </Text>
                  {/* {profileRole && (
                    <Text style={roleStyle}>
                      {profileRole}
                    </Text>
                  )} */}
                </div>

                {/* Contact Information */}
                <div style={{ marginTop: '8px' }}>
                  {displayPhone && (
                    <div style={{ marginBottom: '4px' }}>
                      <Link href={telLink} style={phoneLinkStyle}>
                        📞 {displayPhone}
                      </Link>
                    </div>
                  )}
                  
                  {displayEmail && (
                    <div>
                      <Link href={mailtoLink} style={emailLinkStyle}>
                        🖂 {displayEmail}
                      </Link>
                    </div>
                  )}
                </div>
              </td>

              {/* Make Offer Button Column */}
              <td style={buttonCellStyle}>
                <Button href={mailtoLink} style={buttonStyle}>
                  Make An Offer
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const agentProfileMetadata: EmailComponentMetadata = {
  type: 'agent-profile',
  name: 'agent-profile',
  displayName: 'Agent Profile',
  version: 'v1.0',
  icon: <User className="w-5 h-5" />,
  description: 'Display agent contact information with profile picture and action button',
  category: 'content',
  available: true,
  component: AgentProfile,
  defaultProps: {
    className: '',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    showBorder: true,
    showProfileImage: true,
    overridePhone: '',
    overrideEmail: '',
    style: 'modern',
    alignment: 'left'
  },
  configFields: [
    {
      key: 'style',
      label: 'Style',
      type: 'select',
      options: [
        { label: 'Modern', value: 'modern' },
        { label: 'Classic', value: 'classic' },
        { label: 'Minimal', value: 'minimal' }
      ],
      defaultValue: 'modern'
    },
    {
      key: 'showProfileImage',
      label: 'Show Profile Image',
      type: 'toggle',
      defaultValue: true
    },
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#f8f9fa'
    },
    {
      key: 'borderRadius',
      label: 'Border Radius (px)',
      type: 'number',
      defaultValue: 12
    },
    {
      key: 'showBorder',
      label: 'Show Border',
      type: 'toggle',
      defaultValue: true
    },
    {
      key: 'overridePhone',
      label: 'Override Phone Number',
      type: 'text',
      placeholder: '(555) 123-4567',
      description: 'Override agent phone number'
    },
    {
      key: 'overrideEmail',
      label: 'Override Email',
      type: 'text',
      placeholder: 'agent@example.com',
      description: 'Override agent email'
    }
  ]
};

export default AgentProfile;