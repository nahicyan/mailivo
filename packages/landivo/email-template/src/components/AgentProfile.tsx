// packages/landivo/email-template/src/components/AgentProfile.tsx
import React from 'react';
import { Section, Text, Img, Link } from '@react-email/components';
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
  const fullName = `${agentData?.firstName || ''} ${agentData?.lastName || ''}`.trim();
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
          nameSize: '20px',
          roleSize: '14px'
        };
      case 'minimal':
        return {
          containerPadding: '16px',
          borderColor: 'transparent',
          shadowStyle: 'none',
          nameColor: '#374151',
          roleColor: '#9ca3af',
          nameSize: '18px',
          roleSize: '13px'
        };
      default: // modern
        return {
          containerPadding: '20px',
          borderColor: '#e5e7eb',
          shadowStyle: '0 1px 3px rgba(0, 0, 0, 0.1)',
          nameColor: '#111827',
          roleColor: '#6b7280',
          nameSize: '19px',
          roleSize: '14px'
        };
    }
  };

  const styleConfig = getStyleConfig();

  return (
    <Section
      className={className}
      style={{
        width: '100%',
        padding: '16px 0',
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
        textAlign: alignment
      }}>
        
        {/* Main Content Container */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ 
                verticalAlign: 'top',
                paddingRight: showProfileImage ? '16px' : '0',
                width: showProfileImage ? 'auto' : '100%'
              }}>
                {/* Agent Info Section */}
                <div style={{ marginBottom: '12px' }}>
                  <Text style={{
                    margin: '0 0 4px 0',
                    fontSize: styleConfig.nameSize,
                    fontWeight: '600',
                    color: styleConfig.nameColor,
                    lineHeight: '1.3'
                  }}>
                    Contact {fullName || 'Agent'}
                  </Text>
                  
                  {agentData?.profileRole && (
                    <Text style={{
                      margin: '0 0 8px 0',
                      fontSize: styleConfig.roleSize,
                      color: styleConfig.roleColor,
                      fontStyle: 'italic'
                    }}>
                      {agentData.profileRole}
                    </Text>
                  )}
                </div>

                {/* Contact Information */}
                <div style={{ marginBottom: '16px' }}>
                  {displayPhone && (
                    <div style={{ marginBottom: '6px' }}>
                      <Link
                        href={`tel:${displayPhone}`}
                        style={{
                          color: '#2563eb',
                          textDecoration: 'none',
                          fontSize: '16px',
                          fontWeight: '500',
                          display: 'block'
                        }}
                      >
                        {displayPhone}
                      </Link>
                    </div>
                  )}
                  
                  {displayEmail && (
                    <div>
                      <Link
                        href={`mailto:${displayEmail}`}
                        style={{
                          color: '#6b7280',
                          textDecoration: 'none',
                          fontSize: '14px',
                          display: 'block'
                        }}
                      >
                        {displayEmail}
                      </Link>
                    </div>
                  )}
                </div>
              </td>

              {/* Profile Image Column */}
              {showProfileImage && (
                <td style={{ 
                  verticalAlign: 'top',
                  width: '80px',
                  textAlign: 'right'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid #e5e7eb',
                    backgroundColor: '#f3f4f6',
                    display: 'inline-block'
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
                        fontSize: '24px'
                      }}>
                        👤
                      </div>
                    )}
                  </div>
                </td>
              )}

              {/* Make Offer Button Column */}
              <td style={{ 
                verticalAlign: 'middle',
                paddingLeft: '16px',
                width: '140px',
                textAlign: 'center'
              }}>
                <Link
                  href={`mailto:${finalEmail}?subject=Property Inquiry&body=Hi ${resolvedAgentData?.firstName || ''},\n\nI'm interested in making an offer on one of your properties. Please contact me at your earliest convenience.\n\nThank you!`}
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    textAlign: 'center',
                    border: 'none',
                    lineHeight: '1.2'
                  }}
                >
                  Make an Offer
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
export const agentProfileMetadata: EmailComponentMetadata = {
  type: 'agent-profile',
  name: 'agent-profile',
  displayName: 'Agent Profile',
  version: 'v1.0',
  icon: <User className="w-5 h-5" />,
  description: 'Display agent contact information with profile picture and action button',
  category: 'contact',
  available: true,
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