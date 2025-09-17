// packages/landivo/email-template/src/components/AgentProfile.tsx
import React from 'react';
import { Section, Text, Img, Link, Button } from '@react-email/components';
import { EmailComponentMetadata } from '../types/component-metadata';
import { User } from 'lucide-react';

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
}

export function AgentProfile({
  className = '',
  backgroundColor = '#ffffff',
  borderRadius = 12,
  showBorder = true,
  showProfileImage = true,
  overridePhone,
  overrideEmail,
  agentData,
  style = 'modern',
  alignment = 'left'
}: AgentProfileProps) {

  // Use override values or fall back to agent data
  const displayPhone = overridePhone || agentData?.phone || '';
  const displayEmail = overrideEmail || agentData?.email || '';
  const firstName = agentData?.firstName || '';
  const lastName = agentData?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const avatarUrl = agentData?.avatarUrl ? `https://api.landivo.com/${agentData.avatarUrl}` : '';

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
          phoneColor: '#2563eb',
          emailColor: '#6b7280',
          nameSize: '20px',
          roleSize: '14px',
          buttonBg: '#2563eb',
          buttonHoverBg: '#1d4ed8'
        };
      case 'minimal':
        return {
          containerPadding: '16px',
          borderColor: 'transparent',
          shadowStyle: 'none',
          nameColor: '#374151',
          roleColor: '#9ca3af',
          phoneColor: '#2563eb',
          emailColor: '#9ca3af',
          nameSize: '18px',
          roleSize: '13px',
          buttonBg: '#3b82f6',
          buttonHoverBg: '#2563eb'
        };
      default: // modern
        return {
          containerPadding: '20px',
          borderColor: '#e5e7eb',
          shadowStyle: '0 2px 8px rgba(0, 0, 0, 0.08)',
          nameColor: '#111827',
          roleColor: '#6b7280',
          phoneColor: '#2563eb',
          emailColor: '#6b7280',
          nameSize: '19px',
          roleSize: '14px',
          buttonBg: '#2563eb',
          buttonHoverBg: '#1d4ed8'
        };
    }
  };

  const styleConfig = getStyleConfig();

  // Build mailto link with proper encoding
  const mailtoSubject = encodeURIComponent('Property Inquiry');
  const mailtoBody = encodeURIComponent(`Hi ${firstName || 'there'},\n\nI'm interested in learning more about the property you have listed.\n\nBest regards`);
  const mailtoLink = `mailto:${displayEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <Section
      className={className}
      style={{
        width: '100%',
        padding: '20px 0',
      }}
    >
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: backgroundColor,
        borderRadius: `${borderRadius}px`,
        border: showBorder ? `1px solid ${styleConfig.borderColor}` : 'none',
        boxShadow: styleConfig.shadowStyle,
        padding: styleConfig.containerPadding,
        overflow: 'hidden'
      }}>
        <table style={{
          width: '100%',
          borderSpacing: '0',
          borderCollapse: 'collapse'
        }}>
          <tbody>
            <tr>
              {/* Profile Image Column */}
              {showProfileImage && (
                <td style={{ 
                  verticalAlign: 'middle',
                  width: '80px',
                  paddingRight: '20px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #e5e7eb',
                    backgroundColor: '#f3f4f6',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    {avatarUrl ? (
                      <Img
                        src={avatarUrl}
                        alt={`${fullName} profile`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f9fafb',
                        color: '#9ca3af',
                        fontSize: '32px',
                        fontFamily: 'Arial, sans-serif'
                      }}>
                        👤
                      </div>
                    )}
                  </div>
                </td>
              )}

              {/* Agent Info Column */}
              <td style={{ 
                verticalAlign: 'middle',
                paddingRight: '20px',
                width: 'auto'
              }}>
                {/* Agent Name and Role */}
                <div style={{ marginBottom: '8px' }}>
                  <Text style={{
                    margin: '0 0 2px 0',
                    fontSize: styleConfig.nameSize,
                    fontWeight: '600',
                    color: styleConfig.nameColor,
                    lineHeight: '1.3',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    {fullName || 'Agent'}
                  </Text>
                  
                  {agentData?.profileRole && (
                    <Text style={{
                      margin: '0',
                      fontSize: styleConfig.roleSize,
                      color: styleConfig.roleColor,
                      fontStyle: 'italic',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      {agentData.profileRole}
                    </Text>
                  )}
                </div>

                {/* Contact Information */}
                <div style={{ marginTop: '8px' }}>
                  {displayPhone && (
                    <div style={{ marginBottom: '4px' }}>
                      <Link
                        href={`tel:${displayPhone.replace(/\D/g, '')}`}
                        style={{
                          color: styleConfig.phoneColor,
                          textDecoration: 'none',
                          fontSize: '16px',
                          fontWeight: '500',
                          display: 'inline-block',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                      >
                        📱 {displayPhone}
                      </Link>
                    </div>
                  )}
                  
                  {displayEmail && (
                    <div>
                      <Link
                        href={`mailto:${displayEmail}`}
                        style={{
                          color: styleConfig.emailColor,
                          textDecoration: 'none',
                          fontSize: '14px',
                          display: 'inline-block',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                      >
                        ✉️ {displayEmail}
                      </Link>
                    </div>
                  )}
                </div>
              </td>

              {/* Make Offer Button Column */}
              <td style={{ 
                verticalAlign: 'middle',
                width: '140px',
                textAlign: 'right'
              }}>
                <Button
                  href={mailtoLink}
                  style={{
                    display: 'inline-block',
                    backgroundColor: styleConfig.buttonBg,
                    color: '#ffffff',
                    padding: '14px 24px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    border: 'none',
                    lineHeight: '1.2',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Make an Offer
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
    backgroundColor: '#ffffff',
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
      label: 'Profile Style',
      type: 'select',
      options: [
        { label: 'Modern', value: 'modern' },
        { label: 'Classic', value: 'classic' },
        { label: 'Minimal', value: 'minimal' }
      ],
      defaultValue: 'modern',
      description: 'Choose the visual style'
    },
    {
      key: 'alignment',
      label: 'Alignment',
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ],
      defaultValue: 'left',
      description: 'Text alignment'
    },
    {
      key: 'showProfileImage',
      label: 'Show Profile Image',
      type: 'boolean',
      defaultValue: true,
      description: 'Display agent profile picture'
    },
    {
      key: 'showBorder',
      label: 'Show Border',
      type: 'boolean',
      defaultValue: true,
      description: 'Add border around profile card'
    },
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Profile card background color'
    },
    {
      key: 'borderRadius',
      label: 'Border Radius',
      type: 'number',
      defaultValue: 12,
      min: 0,
      max: 50,
      description: 'Corner roundness in pixels'
    },
    {
      key: 'overridePhone',
      label: 'Override Phone Number',
      type: 'text',
      defaultValue: '',
      placeholder: '(817) 247-1312',
      description: 'Override the agent\'s phone number'
    },
    {
      key: 'overrideEmail',
      label: 'Override Email',
      type: 'text',
      defaultValue: '',
      placeholder: 'agent@company.com',
      description: 'Override the agent\'s email address'
    }
  ]
};