// packages/landivo/email-template/src/components/PaymentCalculator.tsx
import React from 'react';
import { Section, Text, Link, Row, Column } from '@react-email/components';
import { Calculator } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface PaymentCalculatorProps {
  className?: string;
  backgroundColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  spacing?: number;
  propertyData?: any;
  propertyId?: string;
  selectedPlan?: '1' | '2' | '3';
  showMultiplePlansButton?: boolean;
}

export function PaymentCalculator({
  className = '',
  backgroundColor = '#ffffff',
  borderRadius = 8,
  showBorder = true,
  spacing = 16,
  propertyData,
  propertyId = '',
  selectedPlan = '1',
  showMultiplePlansButton = true
}: PaymentCalculatorProps) {

  // Get payment plan data based on selected plan
  const getPlanData = () => {
    // If no property data, return preview data with N/A values
    if (!propertyData) {
      return {
        monthlyPayment: 'N/A',
        downPayment: 'N/A',
        loanAmount: 'N/A',
        interest: 'N/A',
      };
    }

    switch (selectedPlan) {
      case '2':
        return {
          monthlyPayment: propertyData.monthlyPaymentTwo,
          downPayment: propertyData.downPaymentTwo,
          loanAmount: propertyData.loanAmountTwo,
          interest: propertyData.interestTwo,
        };
      case '3':
        return {
          monthlyPayment: propertyData.monthlyPaymentThree,
          downPayment: propertyData.downPaymentThree,
          loanAmount: propertyData.loanAmountThree,
          interest: propertyData.interestThree,
        };
      default: // '1'
        return {
          monthlyPayment: propertyData.monthlyPaymentOne,
          downPayment: propertyData.downPaymentOne,
          loanAmount: propertyData.loanAmountOne,
          interest: propertyData.interestOne,
        };
    }
  };

  const planData = getPlanData();

  // Don't render if we have property data but no valid payment plan data
  if (propertyData && (!planData || !planData.monthlyPayment)) {
    return null;
  }

  // Calculate additional fees (use fallback values for preview)
  const monthlyTax = propertyData ? Math.round((propertyData.tax || 0) / 12) : 10;
  const serviceFee = propertyData ? (propertyData.serviceFee || 35) : 35;

  // Property link for buttons - same pattern as PropertyStatus
  const linkPropertyId = propertyId || (propertyData?.id) || '';
  const propertyLink = linkPropertyId ? `https://landivo.com/properties/${linkPropertyId}` : 'https://landivo.com/properties/';

  const containerStyle = {
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: showBorder ? '1px solid #e5e7eb' : 'none',
    padding: `${spacing}px`,
    margin: '0 auto',
    maxWidth: '600px',
    width: '100%',
  };

  const circleStyle = {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    border: '3px solid #16a34a',
    margin: '0 auto 24px auto',
    textAlign: 'center' as const,
    display: 'table-cell',
    verticalAlign: 'middle',
  };

  const circleContainerStyle = {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    border: '3px solid #16a34a',
    margin: '0 auto 24px auto',
    display: 'table',
  };

  const monthlyPaymentStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#16a34a',
    margin: '0',
    lineHeight: '1.1',
    display: 'block',
  };

  const perMonthStyle = {
    fontSize: '14px',
    color: '#16a34a',
    margin: '4px 0 0 0',
    opacity: '0.9',
    display: 'block',
    lineHeight: '1',
  };

  const columnStyle = {
    width: '50%',
    verticalAlign: 'top',
    padding: '0 8px',
  };

  const itemStyle = {
    marginBottom: '8px',
    display: 'table',
    width: '100%',
  };

  const labelStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#030001',
    margin: '0',
    display: 'table-cell',
    width: '50%',
  };

  const valueStyle = {
    fontSize: '14px',
    color: '#030001',
    margin: '0',
    display: 'table-cell',
    width: '50%',
    textAlign: 'right' as const,
  };

  const benefitBoxStyle = {
    backgroundColor: '#d1fae5',
    border: '1px solid #10b981',
    borderRadius: '6px',
    padding: '12px',
    margin: '16px 0',
    textAlign: 'center' as const,
  };

  const benefitTextStyle = {
    fontSize: '14px',
    color: '#065f46',
    margin: '0 0 4px 0',
    lineHeight: '1.4',
  };

  const outlineButtonStyle = {
    backgroundColor: 'transparent',
    color: '#16a34a',
    border: '2px solid #16a34a',
    borderRadius: '6px',
    padding: '10px 20px',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center' as const,
    margin: '8px auto',
    width: '100%',
    boxSizing: 'border-box',
  };

  const primaryButtonStyle = {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: '2px solid #16a34a',
    borderRadius: '6px',
    padding: '12px 20px',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600',
    textAlign: 'center' as const,
    margin: '8px auto 0',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <Section className={className}>
      <div style={containerStyle}>
        {/* Title */}
        <Text style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#030001',
          textAlign: 'center',
          margin: '0 0 24px 0',
        }}>
          Payment Calculator
        </Text>

        {/* Circular Payment Display */}
        <div style={circleContainerStyle}>
          <div style={circleStyle}>
            <Text style={monthlyPaymentStyle}>
              ${planData.monthlyPayment?.toLocaleString() || planData.monthlyPayment}
            </Text>
            <Text style={perMonthStyle}>
              /mo
            </Text>
          </div>
        </div>

        {/* Payment Details - PropertyDetails Style */}
        <table style={{ width: '100%', margin: '0 0 16px 0' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', padding: '0 8px 0 0' }}>
                <div style={itemStyle}>
                  <Text style={labelStyle}>Monthly Payment</Text>
                  <Text style={valueStyle}>${planData.monthlyPayment?.toLocaleString() || planData.monthlyPayment}/mo</Text>
                </div>

                <div style={itemStyle}>
                  <Text style={labelStyle}>Down Payment</Text>
                  <Text style={valueStyle}>${planData.downPayment?.toLocaleString() || planData.downPayment}</Text>
                </div>

                <div style={itemStyle}>
                  <Text style={labelStyle}>Interest Rate</Text>
                  <Text style={valueStyle}>{planData.interest}% APR</Text>
                </div>
              </td>

              <td style={{ width: '50%', verticalAlign: 'top', padding: '0 0 0 8px' }}>
                <div style={itemStyle}>
                  <Text style={labelStyle}>Loan Amount</Text>
                  <Text style={valueStyle}>${planData.loanAmount?.toLocaleString() || planData.loanAmount}</Text>
                </div>

                <div style={itemStyle}>
                  <Text style={labelStyle}>Property Tax</Text>
                  <Text style={valueStyle}>${monthlyTax}/mo</Text>
                </div>

                <div style={itemStyle}>
                  <Text style={labelStyle}>Service Fee</Text>
                  <Text style={valueStyle}>${serviceFee}/mo</Text>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Multiple Plans Button - Only show if enabled and multiple plans exist */}
        {showMultiplePlansButton && propertyData && (propertyData.financingTwo || propertyData.financingThree) && (
          <div style={{ textAlign: 'center', margin: '0 0 16px 0' }}>
            <Link href={propertyLink} style={outlineButtonStyle}>
              Click here for more payment plans
            </Link>
          </div>
        )}

        {/* Benefits Box */}
        <div style={benefitBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
            <img 
              src="https://cdn.landivo.com/wp-content/uploads/2025/08/currency-dollar.png" 
              alt="Payment" 
              style={{ width: '20px', height: '20px', marginRight: '8px' }}
            />
          </div>
          <Text style={benefitTextStyle}>✓ Takes About 2 Minutes</Text>
          <Text style={benefitTextStyle}>✓ Won't affect your credit score</Text>
        </div>

        {/* Get Pre-Qualified Button */}
        <div style={{ textAlign: 'center' }}>
          <Link href={propertyLink} style={primaryButtonStyle}>
            Get Pre-Qualified
          </Link>
        </div>
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const paymentCalculatorMetadata: EmailComponentMetadata = {
  type: 'payment-calculator',
  name: 'payment-calculator',
  displayName: 'PAYMENT CALCULATOR',
  icon: <Calculator className="w-5 h-5" />,
  description: 'Display payment calculator with circular monthly payment display',
  category: 'content',
  available: true,
  defaultProps: {
    className: '',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    showBorder: true,
    spacing: 16,
    selectedPlan: '1',
    showMultiplePlansButton: true
  },
  configFields: [
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Background color of the payment calculator'
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
      label: 'Internal Spacing',
      type: 'number',
      defaultValue: 16,
      description: 'Internal padding in pixels'
    },
    {
      key: 'selectedPlan',
      label: 'Payment Plan',
      type: 'select',
      options: [
        { label: 'Plan 1', value: '1' },
        { label: 'Plan 2', value: '2' },
        { label: 'Plan 3', value: '3' }
      ],
      defaultValue: '1',
      description: 'Which payment plan to display'
    },
    {
      key: 'showMultiplePlansButton',
      label: 'Show Multiple Plans Button',
      type: 'toggle',
      defaultValue: true,
      description: 'Display button for accessing additional payment plans'
    },
    {
      key: 'propertyId',
      label: 'Property ID',
      type: 'text',
      placeholder: 'property-123',
      description: 'ID for linking to property details page'
    },
    {
      key: 'className',
      label: 'CSS Classes',
      type: 'text',
      placeholder: 'Additional CSS classes',
      description: 'Add custom Tailwind classes for styling'
    }
  ],
  component: PaymentCalculator
};

export default PaymentCalculator;