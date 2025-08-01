// packages/landivo/email-template/src/components/Disclaimer.tsx
import React from 'react';
import { Section, Text } from '@react-email/components';
import { EmailComponentMetadata } from '../types/component-metadata';

interface ContactData {
  email?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

interface DisclaimerProps {
  className?: string;
  backgroundColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  contactData?: ContactData;
  contact?: ContactData;
}

export function Disclaimer({
  className = '',
  backgroundColor = '#f8f9fa',
  borderRadius = 8,
  showBorder = true,
  contactData,
  contact
}: DisclaimerProps) {
  
  // Get firstName from contactData or contact props (template rendering service passes both)
  const firstName = contactData?.firstName || contact?.firstName || '';
  const greeting = firstName ? firstName : 'Dear Visitor';
  
  const disclaimerText = `${greeting}, This is a broker price opinion or comparative market analysis and should not be considered an appraisal or opinion of value. In making any decision that relies upon our work, you should know that we have not followed the guidelines for the development of an appraisal or analysis contained in the Uniform Standards of Professional Appraisal Practice of the Appraisal Foundation. Always perform your due diligence to verify any numbers presented before signing a contract to purchase. Landers Investment LLC has an equitable interest in this property and does not claim to be the owner. Managing Members of Landers Investment LLC holds active real estate licenses in the state of Texas. We do NOT represent you as your real estate agent in any capacity whatsoever unless agreed upon by all parties in writing. Selling through an assignment of contract. LANDERS INVESTMENT is selling an option or assigning an interest in a contract and does not represent, warrant, or claim to be the owner of or currently possess legal title to this, or any of the properties we market for sale. All properties are subject to errors, omissions, deletions, additions, and cancellations. All properties are sold as is, where is, with absolutely no representations written or oral. Buyer is to do their own independent due diligence. The property will not be considered under contract until the signed contract and earnest money are received with all contingencies removed. - Landivo Team`;

  return (
    <Section
      className={`w-full py-4 ${className}`}
      style={{
        width: '100%',
        padding: '16px 0',
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
        {/* Header with title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '8px',
        }}>
          <Text
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#aaaaaaff',
              margin: '0',
              lineHeight: '1.2',
            }}
          >
            Disclaimer:
          </Text>
        </div>

        {/* Disclaimer text - compact and small */}
        <div style={{
          display: 'block',
        }}>
          <Text
            style={{
              fontSize: '11px',
              fontWeight: '400',
              color: '#aaaaaaff',
              margin: '0',
              lineHeight: '1.3',
              display: 'block',
              textAlign: 'justify',
            }}
          >
            {disclaimerText}
          </Text>
        </div>
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const disclaimerMetadata: EmailComponentMetadata = {
  type: 'disclaimer',
  name: 'disclaimer',
  displayName: 'Disclaimer',
  version: 'v1.0',
  icon: '',
  description: 'Display legal disclaimer with compact formatting and dynamic greeting',
  category: 'content',
  available: true,
  defaultProps: {
    className: '',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    showBorder: true,
    textColor: '#aaaaaaff'
  },
  configFields: [
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#f8f9fa',
      description: 'Background color of the disclaimer section'
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
      key: 'textColor',
      label: 'Text Color',
      type: 'color',
      defaultValue: '#aaaaaaff',
      description: 'Color of the disclaimer text'
    },
    {
      key: 'className',
      label: 'CSS Classes',
      type: 'text',
      placeholder: 'Additional CSS classes',
      description: 'Add custom Tailwind classes for styling'
    }
  ],
  component: Disclaimer
};

export default Disclaimer;