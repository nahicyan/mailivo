// packages/landivo/email-template/src/components/JoinVipList.tsx
import React from 'react';
import {
  Section,
  Text,
  Button,
  Hr,
  Img,
} from '@react-email/components';
import { EmailComponentMetadata } from '../types/component-metadata';
import { Crown } from 'lucide-react';

export interface JoinVipListProps {
  className?: string;
  backgroundColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  primaryColor?: string;
  buttonText?: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string[];
  features?: string[];
  footerText?: string;
}

export function JoinVipList({
  className = '',
  backgroundColor = '#f8f9fa',
  borderRadius = 8,
  showBorder = true,
  primaryColor = '#2a5e56',
  buttonText = 'Join VIP List - It\'s Free',
  imageUrl = 'https://cdn.landivo.com/wp-content/uploads/2025/08/newsletter.png',
  title = 'Join Our VIP List',
  subtitle = ['Get early access to the best properties before they hit the market','Receive personalized property alerts tailored to','Your investment criteria and budget.',],
  features = [
    'Properties matched to your exact preferences',
    'Early notifications before public listings',
    'Exclusive deals and financing options',

  ],
  footerText = 'Trusted by 10,000+ investors nationwide',
}: JoinVipListProps) {

  return (
    <Section
      className={className}
      style={{
        width: '100%',
        // padding: '16px 0',
      }}
    >
      {/* Container with proper width constraints like other components */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: backgroundColor,
        borderRadius: `${borderRadius}px`,
        border: showBorder ? '1px solid #e5e7eb' : 'none',
      }}>
        {/* Newsletter Icon/Image */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Img
            src={imageUrl}
            alt="Newsletter"
            width="80"
            height="80"
            style={{
              display: 'block',
              margin: '0 auto',
              borderRadius: '12px',
              backgroundColor: '#f1f5f9',
              padding: '16px',
            }}
          />
        </div>

        {/* Title */}
        <Text
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#275951',
            margin: '0 0 16px 0',
            lineHeight: '1.2',
            textAlign: 'center',
          }}
        >
          {title}
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: '16px',
            color: '#64748b',
            margin: '0 0 32px 0',
            lineHeight: '1.5',
            textAlign: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: subtitle }}
        />

        {/* Features list */}
        <div style={{
          display: 'block',
          marginBottom: '32px',
          maxWidth: '300px',
          margin: '0 auto 32px auto',
        }}>
          {features.map((feature, index) => (
            <div key={index} style={{ 
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#28645b',
                  borderRadius: '50%',
                  marginRight: '12px',
                  flexShrink: 0,
                  marginTop: '6px',
                }}
              />
              <Text
                style={{
                  fontSize: '15px',
                  fontWeight: '400',
                  color: '#475569',
                  margin: '0',
                  lineHeight: '1.4',
                  display: 'block',
                  textAlign: 'left',
                }}
              >
                {feature}
              </Text>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Button
            href="https://landivo.com/vip-signup"
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              display: 'inline-block',
              border: 'none',
              cursor: 'pointer',
              boxShadow: `0 4px 14px 0 ${primaryColor}40`,
            }}
          >
            {buttonText}
          </Button>
        </div>

        {/* Divider */}
        <Hr
          style={{
            border: 'none',
            borderTop: '1px solid #e2e8f0',
            margin: '0 0 20px 0',
            width: '100%',
          }}
        />

        {/* Footer Text */}
        <Text
          style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: '0',
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          {footerText}
        </Text>
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const joinVipListMetadata: EmailComponentMetadata = {
  type: 'join-vip-list',
  templateType: 'any',
  name: 'join-vip-list',
  displayName: 'Join VIP List',
  version: 'v1.0',
  icon: <Crown className="w-5 h-5" />,
  description: 'VIP list signup form with features and call-to-action',
  category: 'content',
  available: true,
  defaultProps: {
    className: '',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    showBorder: true,
    primaryColor: '#2a5e56',
    buttonText: 'Join VIP List - It\'s Free',
    imageUrl: 'https://cdn.landivo.com/wp-content/uploads/2025/08/newsletter.png',
    title: 'Join Our VIP List',
    subtitle: 'Get early access to the best properties before they hit the market.<br/>Receive personalized property alerts tailored to your investment criteria and budget.',
    features: [
      'Properties matched to your exact preferences',
      'Early notifications before public listings',
      'Exclusive deals and financing options',
      'Direct line to our property specialists'
    ],
    footerText: 'Trusted by 10,000+ investors nationwide',
  },
  configFields: [
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#f8f9fa',
      description: 'Background color of the guidelines section'
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
      key: 'primaryColor',
      label: 'Primary Color',
      type: 'color',
      defaultValue: '#2a5e56',
      description: 'Primary color for button and accents'
    },
    {
      key: 'title',
      label: 'Title',
      type: 'text',
      defaultValue: 'Join Our VIP List',
      description: 'Main heading text'
    },
    {
      key: 'subtitle',
      label: 'Subtitle',
      type: 'textarea',
      defaultValue: 'Get early access to the best properties before they hit the market.<br/>Receive personalized property alerts tailored to your investment criteria and budget.',
      description: 'Subtitle text (HTML allowed)'
    },
    {
      key: 'buttonText',
      label: 'Button Text',
      type: 'text',
      defaultValue: 'Join VIP List - It\'s Free',
      description: 'Call-to-action button text'
    },
    {
      key: 'footerText',
      label: 'Footer Text',
      type: 'text',
      defaultValue: 'Trusted by 10,000+ investors nationwide',
      description: 'Text below the button'
    },
    {
      key: 'imageUrl',
      label: 'Image URL',
      type: 'text',
      defaultValue: 'https://cdn.landivo.com/wp-content/uploads/2025/08/newsletter.png',
      description: 'URL for the header image'
    },
    {
      key: 'className',
      label: 'CSS Classes',
      type: 'text',
      placeholder: 'Additional CSS classes',
      description: 'Add custom CSS classes for styling'
    }
  ],
  component: JoinVipList
};

export default JoinVipList;