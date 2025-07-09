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
  selectedPlan?: string;
  serverURL: string;
}

export const PropertyCampaignEmail = ({
  property,
  selectedPlan = "1",
  serverURL
}: PropertyCampaignEmailProps) => {
  
  // Get plan data based on selection
  const getPlanData = () => {
    switch (selectedPlan) {
      case "2":
        return {
          monthlyPayment: property.monthlyPaymentTwo,
          downPayment: property.downPaymentTwo,
          loanAmount: property.loanAmountTwo,
          interest: property.interestTwo,
        };
      case "3":
        return {
          monthlyPayment: property.monthlyPaymentThree,
          downPayment: property.downPaymentThree,
          loanAmount: property.loanAmountThree,
          interest: property.interestThree,
        };
      default:
        return {
          monthlyPayment: property.monthlyPaymentOne,
          downPayment: property.downPaymentOne,
          loanAmount: property.loanAmountOne,
          interest: property.interestOne,
        };
    }
  };

  const planData = getPlanData();
  
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

  return (
    <Html>
      <Head />
      <Preview>New Land Available - {property.streetAddress}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>{property.title}</Heading>
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
            <table width="100%">
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
                  <div style={highlightIcon}>□</div>
                  <div style={highlightValue}>{property.sqft?.toLocaleString()}</div>
                  <div style={highlightLabel}>21,154 sqft</div>
                </td>
                <td style={highlightCell} align="center">
                  <div style={highlightIcon}>🏠</div>
                  <div style={highlightValue}>{property.zoning}</div>
                  <div style={highlightLabel}>Zoning</div>
                </td>
                <td style={highlightCell} align="center">
                  <div style={highlightIcon}>📍</div>
                  <div style={highlightValue}>0.49 acres</div>
                  <div style={highlightLabel}>Acreage</div>
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
                <Heading as="h4" style={h4}>Location</Heading>
                <Text style={detailText}>
                  <strong>County:</strong> {property.county}<br />
                  <strong>State:</strong> {property.state}<br />
                  <strong>Zip:</strong> {property.zip}
                </Text>
              </Column>
              <Column style={detailColumn}>
                <Heading as="h4" style={h4}>Property Details</Heading>
                <Text style={detailText}>
                  <strong>Size:</strong> {property.sqft?.toLocaleString()}<br />
                  <strong>Acreage:</strong> {property.acre}<br />
                  <strong>Zoning:</strong> {property.zoning}<br />
                  <strong>Parcel:</strong> {property.apnOrPin}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Utilities */}
          <Section>
            <table width="100%" style={utilityTable}>
              <tr>
                <td><strong>Land Type:</strong> {property.landType?.join(', ')}</td>
                <td><strong>Water:</strong> {property.water || 'N/A'}</td>
              </tr>
              <tr>
                <td><strong>Sewer:</strong> {property.sewer || 'N/A'}</td>
                <td><strong>Electric:</strong> {property.electric || 'N/A'}</td>
              </tr>
            </table>
          </Section>

          {/* Payment Calculator */}
          {property.financing && property.financing !== 'Not-Available' && planData.monthlyPayment && (
            <Section style={paymentSection}>
              <Heading as="h3" style={h3}>Payment Calculator - Plan {selectedPlan}</Heading>
              
              {/* Monthly Payment Circle */}
              <div style={paymentCircleContainer}>
                <div style={paymentCircle}>
                  <Text style={paymentAmount}>${planData.monthlyPayment?.toLocaleString()}</Text>
                  <Text style={paymentPeriod}>/mo</Text>
                </div>
              </div>

              {/* Payment Details Table */}
              <table style={paymentTable}>
                <tr>
                  <td style={paymentRow}>
                    <span>Monthly Payment</span>
                    <span style={paymentValue}>${planData.monthlyPayment?.toLocaleString()}/mo</span>
                  </td>
                </tr>
                <tr>
                  <td style={paymentRow}>
                    <span>Loan Amount</span>
                    <span style={paymentValue}>${planData.loanAmount?.toLocaleString()}</span>
                  </td>
                </tr>
                <tr>
                  <td style={paymentRow}>
                    <span>Down Payment</span>
                    <span style={paymentValue}>${planData.downPayment?.toLocaleString()}</span>
                  </td>
                </tr>
                <tr>
                  <td style={paymentRow}>
                    <span>Property Tax</span>
                    <span style={paymentValue}>${Math.round((property.tax || 0) / 12)}/mo</span>
                  </td>
                </tr>
                <tr>
                  <td style={paymentRow}>
                    <span>Interest Rate</span>
                    <span style={paymentValue}>{planData.interest}% APR</span>
                  </td>
                </tr>
                <tr>
                  <td style={paymentRow}>
                    <span>Loan Term</span>
                    <span style={paymentValue}>{property.term || 60} Months</span>
                  </td>
                </tr>
                <tr>
                  <td style={paymentRow}>
                    <span>Service Fee</span>
                    <span style={paymentValue}>${property.serviceFee || 35}/mo</span>
                  </td>
                </tr>
              </table>

              <Section style={qualifySection}>
                <Text style={qualifyText}>
                  ✓ Takes About 2 Minutes<br />
                  ✓ Won't affect your credit score
                </Text>
                <Button href="https://landivo.com/pre-qualify" style={qualifyButton}>
                  Get Pre-Qualified
                </Button>
              </Section>
            </Section>
          )}

          {/* Description */}
          <Section>
            <Text style={description}>
              {property.description?.substring(0, 400) + '...' || 'No description available'}
            </Text>
          </Section>

          {/* Buyer Guidelines */}
          <Section style={guidelinesSection}>
            <Heading as="h4" style={h4}>Buyer Guidelines</Heading>
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
            <Link href="#" style={footerLink}>
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
};

const header = {
  padding: '20px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const h3 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '10px 0',
};

const h4 = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '10px 0',
};

const heroImage = {
  width: '100%',
  height: 'auto',
  objectFit: 'cover' as const,
};

const badgeSection = {
  padding: '20px',
};

const statusBadge = {
  backgroundColor: '#fef3c7',
  color: '#92400e',
  padding: '6px 12px',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: 'bold',
};

const ctaButton = {
  backgroundColor: '#16a34a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '10px 20px',
  display: 'inline-block',
};

const highlightsSection = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  margin: '0 20px',
  borderRadius: '8px',
};

const highlightCell = {
  padding: '10px',
  textAlign: 'center' as const,
};

const highlightIcon = {
  fontSize: '20px',
  marginBottom: '5px',
};

const highlightValue = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1a1a1a',
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
};

const detailText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#4b5563',
};

const utilityTable = {
  width: '100%',
  padding: '0 20px',
  fontSize: '14px',
  color: '#4b5563',
};

const paymentSection = {
  backgroundColor: '#eff6ff',
  padding: '30px 20px',
  margin: '20px',
  borderRadius: '8px',
};

const paymentCircleContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
};

const paymentCircle = {
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  backgroundColor: '#ffffff',
  border: '8px solid #2563eb',
  display: 'inline-block',
  textAlign: 'center' as const,
  paddingTop: '45px',
};

const paymentAmount = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#2563eb',
  margin: '0',
};

const paymentPeriod = {
  fontSize: '14px',
  color: '#2563eb',
};

const paymentTable = {
  width: '100%',
  marginTop: '20px',
};

const paymentRow = {
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  padding: '8px 0',
  fontSize: '14px',
  borderBottom: '1px solid #e5e7eb',
};

const paymentValue = {
  fontWeight: 'bold',
};

const qualifySection = {
  backgroundColor: '#dcfce7',
  padding: '20px',
  borderRadius: '6px',
  marginTop: '20px',
  textAlign: 'center' as const,
};

const qualifyText = {
  color: '#166534',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '1.6',
};

const qualifyButton = {
  backgroundColor: '#16a34a',
  color: '#ffffff',
  padding: '12px 30px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: 'bold',
  display: 'inline-block',
  marginTop: '10px',
};

const description = {
  padding: '0 20px',
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#4b5563',
};

const guidelinesSection = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  margin: '20px',
  borderRadius: '8px',
};

const guidelineText = {
  fontSize: '12px',
  lineHeight: '1.8',
  color: '#374151',
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