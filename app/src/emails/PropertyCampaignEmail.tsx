// app/src/emails/PropertyCampaignEmail.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface PropertyCampaignEmailProps {
  property: any;
  serverURL: string;
}

export const PropertyCampaignEmail = ({
  property,
  serverURL
}: PropertyCampaignEmailProps) => {
  
  const getPropertyImage = () => {
    if (!property.imageUrls) return null;
    let images = [];
    try {
      images = Array.isArray(property.imageUrls) ? property.imageUrls : JSON.parse(property.imageUrls);
    } catch (error) {
      return null;
    }
    return images.length ? `${serverURL}/${images[0]}` : null;
  };

  const propertyImage = getPropertyImage();
  const emailSubject = `🔥 Great Lot in ${property.city}, ${property.state} – Act Fast!`;

  // Check which plans are available
  const availablePlans = [];
  if (property.monthlyPaymentOne) {
    availablePlans.push({
      number: 1,
      monthlyPayment: property.monthlyPaymentOne,
      downPayment: property.downPaymentOne,
      loanAmount: property.loanAmountOne,
      interest: property.interestOne,
    });
  }
  if (property.monthlyPaymentTwo) {
    availablePlans.push({
      number: 2,
      monthlyPayment: property.monthlyPaymentTwo,
      downPayment: property.downPaymentTwo,
      loanAmount: property.loanAmountTwo,
      interest: property.interestTwo,
    });
  }
  if (property.monthlyPaymentThree) {
    availablePlans.push({
      number: 3,
      monthlyPayment: property.monthlyPaymentThree,
      downPayment: property.downPaymentThree,
      loanAmount: property.loanAmountThree,
      interest: property.interestThree,
    });
  }

  const hasFinancing = property.financing && property.financing !== 'Not-Available' && availablePlans.length > 0;

  return (
    <Html>
      <Head />
      <Preview>{emailSubject}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Rich Text Title */}
          <Section style={header}>
            <div dangerouslySetInnerHTML={{ __html: property.title }} style={titleStyle} />
          </Section>

          {/* Property Image */}
          {propertyImage && (
            <Section>
              <Img
                src={propertyImage}
                width="600"
                height="300"
                alt="Property"
                style={heroImage}
              />
            </Section>
          )}

          {/* Status Badge and CTA */}
          <Section style={badgeSection}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td align="left">
                  <span style={statusBadge}>{property.status}</span>
                </td>
                <td align="right">
                  <Button
                    href={`https://landivo.com/properties/${property.id}`}
                    style={ctaButton}
                  >
                    View Details & Pricing
                  </Button>
                </td>
              </tr>
            </table>
          </Section>

          {/* Property Highlights */}
          <Section style={highlightsSection}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td style={highlightCell} align="center">
                  <div style={highlightIcon}>⬜</div>
                  <div style={highlightValue}>{property.sqft?.toLocaleString()}</div>
                  <div style={highlightLabel}>sqft</div>
                </td>
                <td style={highlightCell} align="center">
                  <div style={highlightIcon}>🏠</div>
                  <div style={highlightValue}>{property.zoning}</div>
                  <div style={highlightLabel}>Zoning</div>
                </td>
                <td style={highlightCell} align="center">
                  <div style={highlightIcon}>⚡</div>
                  <div style={highlightValue}>Not Available</div>
                  <div style={highlightLabel}>Survey</div>
                </td>
                <td style={highlightCell} align="center">
                  <div style={highlightIcon}>⏰</div>
                  <div style={highlightValue}>Available</div>
                  <div style={highlightLabel}>Financing</div>
                </td>
              </tr>
            </table>
          </Section>

          {/* Location & Property Details */}
          <Section style={detailsSection}>
            <Row>
              <Column style={detailColumn}>
                <Heading as="h3" style={h3}>Location</Heading>
                <Text style={detailText}>
                  <strong>County:</strong> {property.county}<br />
                  <strong>State:</strong> {property.state}<br />
                  <strong>Zip:</strong> {property.zip}
                </Text>
              </Column>
              <Column style={detailColumn}>
                <Heading as="h3" style={h3}>Property Details</Heading>
                <Text style={detailText}>
                  <strong>Size:</strong> {property.sqft?.toLocaleString()} sqft<br />
                  <strong>Acreage:</strong> {property.acre}<br />
                  <strong>Zoning:</strong> {property.zoning}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Payment Calculator - Email Client Friendly */}
          {hasFinancing && (
            <Section style={paymentSection}>
              <Heading as="h3" style={h3}>💰 Payment Calculator</Heading>
              <Text style={paymentSubtext}>
                Choose from {availablePlans.length} flexible payment plan{availablePlans.length > 1 ? 's' : ''}:
              </Text>
              
              {/* Display all available plans */}
              {availablePlans.map((plan, index) => (
                <div key={plan.number} style={planContainer}>
                  <div style={planHeader}>
                    <span style={planTitle}>Plan {plan.number}</span>
                    {index === 0 && <span style={recommendedBadge}>Recommended</span>}
                  </div>
                  
                  <div style={planContent}>
                    {/* Payment Circle */}
                    <div style={paymentCircleContainer}>
                      <div style={paymentCircle}>
                        <div style={paymentAmount}>${plan.monthlyPayment?.toLocaleString()}</div>
                        <div style={paymentPeriod}>/mo</div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <table style={paymentDetailsTable}>
                      <tr>
                        <td style={paymentDetailRow}>
                          <span style={paymentLabel}>Monthly Payment</span>
                          <span style={paymentValue}>${plan.monthlyPayment?.toLocaleString()}/mo</span>
                        </td>
                        <td style={paymentDetailRow}>
                          <span style={paymentLabel}>Loan Amount</span>
                          <span style={paymentValue}>${plan.loanAmount?.toLocaleString()}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={paymentDetailRow}>
                          <span style={paymentLabel}>Down Payment</span>
                          <span style={paymentValue}>${plan.downPayment?.toLocaleString()}</span>
                        </td>
                        <td style={paymentDetailRow}>
                          <span style={paymentLabel}>Property Tax</span>
                          <span style={paymentValue}>${Math.round((property.tax || 0) / 12)}/mo</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={paymentDetailRow}>
                          <span style={paymentLabel}>Interest Rate</span>
                          <span style={paymentValue}>{plan.interest}% APR</span>
                        </td>
                        <td style={paymentDetailRow}>
                          <span style={paymentLabel}>Service Fee</span>
                          <span style={paymentValue}>${property.serviceFee || 35}/mo</span>
                        </td>
                      </tr>
                    </table>

                    {/* Plan-specific CTA */}
                    <div style={planCTA}>
                      <Button 
                        href={`https://landivo.com/properties/${property.id}?plan=${plan.number}`} 
                        style={planButton}
                      >
                        Select Plan {plan.number}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pre-Qualification Section */}
              <Section style={qualifySection}>
                <div style={qualifyBenefits}>
                  <div style={qualifyBenefit}>✓ Takes About 2 Minutes</div>
                  <div style={qualifyBenefit}>✓ Won't affect your credit score</div>
                </div>
                <Button href={`https://landivo.com/properties/${property.id}/pre-qualify`} style={qualifyButton}>
                  Get Pre-Qualified Now
                </Button>
              </Section>
            </Section>
          )}

          {/* Property Description */}
          <Section style={descriptionSection}>
            <Heading as="h3" style={h3}>Property Description</Heading>
            <div dangerouslySetInnerHTML={{ 
              __html: property.description?.substring(0, 400) + '...' || 'No description available' 
            }} style={descriptionText} />
          </Section>

          {/* Buyer Guidelines */}
          <Section style={guidelinesSection}>
            <Heading as="h3" style={h3}>📋 Buyer Guidelines</Heading>
            <Text style={guidelineText}>
              • Buyer pays ALL closing costs.<br />
              • Cash OR Hard Money Only.<br />
              • A $395 transaction fee applies to each contract and is payable by the buyer.<br />
              • This Property is being sold AS-IS.<br />
              • No Daisy Chaining – No Option Period.<br />
              • Due diligence required before submitting an offer.<br />
              • Agents, please add your commission to the buyer's sales price.<br />
              • Earnest money deposit varies per property.<br />
              • Closing ASAP.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you're subscribed to property alerts.
            </Text>
            <Link href={`${serverURL}/unsubscribe`} style={footerLink}>
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  border: '1px solid #e5e7eb',
};

const header = {
  padding: '20px',
  textAlign: 'center' as const,
};

const titleStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0',
  lineHeight: '1.2',
};

const h3 = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const heroImage = {
  width: '100%',
  height: 'auto',
  objectFit: 'cover' as const,
  borderRadius: '8px',
};

const badgeSection = {
  padding: '20px',
};

const statusBadge = {
  backgroundColor: '#fef3c7',
  color: '#92400e',
  padding: '8px 16px',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
};

const ctaButton = {
  backgroundColor: '#16a34a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
  display: 'inline-block',
};

const highlightsSection = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  margin: '0 20px',
  borderRadius: '8px',
};

const highlightCell = {
  padding: '16px',
  textAlign: 'center' as const,
  width: '25%',
};

const highlightIcon = {
  fontSize: '24px',
  marginBottom: '8px',
};

const highlightValue = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  marginBottom: '4px',
};

const highlightLabel = {
  fontSize: '12px',
  color: '#6b7280',
};

const detailsSection = {
  padding: '20px',
};

const detailColumn = {
  width: '50%',
  padding: '0 10px',
  verticalAlign: 'top' as const,
};

const detailText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#4b5563',
  margin: '0',
};

const paymentSection = {
  backgroundColor: '#ffffff',
  padding: '30px 20px',
  margin: '20px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
};

const paymentSubtext = {
  fontSize: '14px',
  color: '#6b7280',
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const planContainer = {
  backgroundColor: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderRadius: '12px',
  marginBottom: '20px',
  overflow: 'hidden',
};

const planHeader = {
  backgroundColor: '#16a34a',
  padding: '16px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const planTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ffffff',
};

const recommendedBadge = {
  backgroundColor: '#fbbf24',
  color: '#92400e',
  padding: '4px 12px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
};

const planContent = {
  padding: '24px 20px',
};

const paymentCircleContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
};

const paymentCircle = {
  width: '140px',
  height: '140px',
  borderRadius: '50%',
  backgroundColor: '#ffffff',
  border: '6px solid #16a34a',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column' as const,
  margin: '0 auto',
};

const paymentAmount = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#16a34a',
  lineHeight: '1',
};

const paymentPeriod = {
  fontSize: '12px',
  color: '#16a34a',
  marginTop: '4px',
};

const paymentDetailsTable = {
  width: '100%',
  marginTop: '20px',
  borderCollapse: 'collapse' as const,
};

const paymentDetailRow = {
  padding: '12px',
  borderBottom: '1px solid #e5e7eb',
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
};

const paymentLabel = {
  fontSize: '13px',
  fontWeight: '500',
  color: '#374151',
  display: 'block',
  marginBottom: '4px',
};

const paymentValue = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  display: 'block',
};

const planCTA = {
  textAlign: 'center' as const,
  marginTop: '20px',
};

const planButton = {
  backgroundColor: '#16a34a',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 'bold',
  display: 'inline-block',
  border: '2px solid #16a34a',
};

const qualifySection = {
  backgroundColor: '#dcfce7',
  padding: '20px',
  borderRadius: '8px',
  marginTop: '20px',
  textAlign: 'center' as const,
};

const qualifyBenefits = {
  marginBottom: '16px',
};

const qualifyBenefit = {
  color: '#166534',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '1.5',
  margin: '4px 0',
};

const qualifyButton = {
  backgroundColor: '#16a34a',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: 'bold',
  display: 'inline-block',
};

const descriptionSection = {
  padding: '20px',
};

const descriptionText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#4b5563',
};

const guidelinesSection = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  margin: '20px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const guidelineText = {
  fontSize: '13px',
  lineHeight: '1.8',
  color: '#374151',
  margin: '0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '40px 0',
};

const footer = {
  padding: '20px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0 0 10px 0',
};

const footerLink = {
  fontSize: '12px',
  color: '#2563eb',
  textDecoration: 'underline',
};

export default PropertyCampaignEmail;