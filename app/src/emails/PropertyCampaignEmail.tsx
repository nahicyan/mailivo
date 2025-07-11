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
    
    if (images.length === 0) return null;
    
    const firstImagePath = images[0];
    
    // If the image path is already a full URL, return it as is
    if (firstImagePath.startsWith('http://') || firstImagePath.startsWith('https://')) {
      return firstImagePath;
    }
    
    const baseURL = serverURL.includes('landivo.com') ? serverURL : 'https://landivo.com/api';
    
    // Remove any trailing slash from baseURL and leading slash from image path
    const cleanBaseURL = baseURL.replace(/\/$/, '');
    const cleanImagePath = firstImagePath.replace(/^\//, '');
    
    // Construct the full URL for email clients
    return `${cleanBaseURL}/${cleanImagePath}`;
  };

  const propertyImage = getPropertyImage();
  const emailSubject = `🔥 Great Lot in ${property.city}, ${property.state} – Act Fast!`;

  // Check which plans are available
  const availablePlans = [];
  if (property.monthlyPaymentOne) availablePlans.push(1);
  if (property.monthlyPaymentTwo) availablePlans.push(2);
  if (property.monthlyPaymentThree) availablePlans.push(3);

  // Get the first available plan details
  const getPlanDetails = (planNum: number) => {
    switch(planNum) {
      case 1:
        return {
          monthly: property.monthlyPaymentOne,
          loan: property.loanAmountOne,
          down: property.downPaymentOne,
          interest: property.interestOne
        };
      case 2:
        return {
          monthly: property.monthlyPaymentTwo,
          loan: property.loanAmountTwo,
          down: property.downPaymentTwo,
          interest: property.interestTwo
        };
      case 3:
        return {
          monthly: property.monthlyPaymentThree,
          loan: property.loanAmountThree,
          down: property.downPaymentThree,
          interest: property.interestThree
        };
      default:
        return null;
    }
  };

  const firstPlan = availablePlans[0];
  const planDetails = firstPlan ? getPlanDetails(firstPlan) : null;

  return (
    <Html>
      <Head>
        <style>{`
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content-padding { padding: 16px !important; }
            .section-padding { padding: 16px !important; }
            .hero-image { height: 200px !important; }
            .title-text { font-size: 20px !important; }
            .h3-text { font-size: 16px !important; }
            .button-primary { padding: 14px 24px !important; font-size: 14px !important; }
            .button-secondary { padding: 12px 20px !important; font-size: 13px !important; }
            .payment-circle { width: 120px !important; height: 120px !important; line-height: 104px !important; }
            .payment-amount { font-size: 22px !important; }
            .highlight-grid { display: block !important; }
            .highlight-cell { 
              display: inline-block !important; 
              width: 48% !important; 
              margin-bottom: 16px !important; 
              padding: 12px !important;
            }
            .detail-column { 
              display: block !important; 
              width: 100% !important; 
              margin-bottom: 20px !important; 
            }
            .payment-detail-row { 
              display: block !important; 
              width: 100% !important; 
              margin-bottom: 12px !important; 
            }
            .vip-content { padding: 24px 16px !important; }
            .vip-heading { font-size: 22px !important; }
            .vip-benefits { max-width: 100% !important; }
          }
        `}</style>
      </Head>
      <Preview>{emailSubject}</Preview>
      <Body style={main}>
        <Container style={container} className="container">
          {/* Header with Rich Text Title */}
          <Section style={header} className="content-padding">
            <div dangerouslySetInnerHTML={{ __html: property.title }} style={titleStyle} className="title-text" />
          </Section>

          {/* Property Image */}
          {propertyImage && (
            <Section>
              <Img
                src={propertyImage}
                width="600"
                height="350"
                alt="Property"
                style={heroImage}
                className="hero-image"
              />
            </Section>
          )}

          {/* Status Badge and CTA */}
          <Section style={badgeSection} className="section-padding">
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td align="left" style={{ verticalAlign: 'middle' }}>
                  <span style={statusBadge}>{property.status}</span>
                </td>
                <td align="right" style={{ verticalAlign: 'middle' }}>
                  <Button
                    href={`https://landivo.com/properties/${property.id}`}
                    style={ctaButton}
                    className="button-primary"
                  >
                    View Details & Pricing
                  </Button>
                </td>
              </tr>
            </table>
          </Section>

          {/* Property Highlights */}
          <Section style={highlightsSection} className="section-padding">
            <table width="100%" cellPadding="0" cellSpacing="0" className="highlight-grid">
              <tr>
                <td style={highlightCell} align="center" className="highlight-cell">
                  <div style={highlightIconContainer}>
                    <div style={highlightIcon}>📏</div>
                  </div>
                  <div style={highlightValue}>{property.sqft?.toLocaleString()}</div>
                  <div style={highlightLabel}>sqft</div>
                </td>
                <td style={highlightCell} align="center" className="highlight-cell">
                  <div style={highlightIconContainer}>
                    <div style={highlightIcon}>🏠</div>
                  </div>
                  <div style={highlightValue}>{property.zoning}</div>
                  <div style={highlightLabel}>Zoning</div>
                </td>
                <td style={highlightCell} align="center" className="highlight-cell">
                  <div style={highlightIconContainer}>
                    <div style={highlightIcon}>📊</div>
                  </div>
                  <div style={highlightValue}>Not Available</div>
                  <div style={highlightLabel}>Survey</div>
                </td>
                <td style={highlightCell} align="center" className="highlight-cell">
                  <div style={highlightIconContainer}>
                    <div style={highlightIcon}>💰</div>
                  </div>
                  <div style={highlightValue}>Available</div>
                  <div style={highlightLabel}>Financing</div>
                </td>
              </tr>
            </table>
          </Section>

          {/* Location & Property Details */}
          <Section style={detailsSection} className="section-padding">
            <Row>
              <Column style={detailColumn} className="detail-column">
                <div style={detailCard}>
                  <Heading as="h3" style={h3} className="h3-text">📍 Location</Heading>
                  <Text style={detailText}>
                    <strong>County:</strong> {property.county}<br />
                    <strong>State:</strong> {property.state}<br />
                    <strong>Zip:</strong> {property.zip}
                  </Text>
                </div>
              </Column>
              <Column style={detailColumn} className="detail-column">
                <div style={detailCard}>
                  <Heading as="h3" style={h3} className="h3-text">📋 Property Details</Heading>
                  <Text style={detailText}>
                    <strong>Size:</strong> {property.sqft?.toLocaleString()} sqft<br />
                    <strong>Acreage:</strong> {property.acre}<br />
                    <strong>Zoning:</strong> {property.zoning}
                  </Text>
                </div>
              </Column>
            </Row>
          </Section>

          {/* Payment Calculator - Show only first available plan */}
          {property.financing && property.financing !== 'Not-Available' && planDetails && (
            <Section style={paymentSection} className="section-padding">
              <Heading as="h3" style={paymentHeading} className="h3-text">💳 Payment Calculator</Heading>
              
              <div style={paymentCircleContainer}>
                <div style={paymentCircle} className="payment-circle">
                  <div style={paymentCircleInner}>
                    <div style={paymentAmount} className="payment-amount">${planDetails.monthly?.toLocaleString()}</div>
                    <div style={paymentPeriod}>/mo</div>
                  </div>
                </div>
              </div>

              <table style={paymentDetailsTable}>
                <tr>
                  <td style={paymentDetailRow} className="payment-detail-row">
                    <div style={paymentDetailCard}>
                      <span style={paymentLabel}>Monthly Payment</span>
                      <span style={paymentValue}>${planDetails.monthly?.toLocaleString()}/mo</span>
                    </div>
                  </td>
                  <td style={paymentDetailRow} className="payment-detail-row">
                    <div style={paymentDetailCard}>
                      <span style={paymentLabel}>Loan Amount</span>
                      <span style={paymentValue}>${planDetails.loan?.toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={paymentDetailRow} className="payment-detail-row">
                    <div style={paymentDetailCard}>
                      <span style={paymentLabel}>Down Payment</span>
                      <span style={paymentValue}>${planDetails.down?.toLocaleString()}</span>
                    </div>
                  </td>
                  <td style={paymentDetailRow} className="payment-detail-row">
                    <div style={paymentDetailCard}>
                      <span style={paymentLabel}>Property Tax</span>
                      <span style={paymentValue}>${Math.round((property.tax || 0) / 12)}/mo</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={paymentDetailRow} className="payment-detail-row">
                    <div style={paymentDetailCard}>
                      <span style={paymentLabel}>Interest Rate</span>
                      <span style={paymentValue}>{planDetails.interest}% APR</span>
                    </div>
                  </td>
                  <td style={paymentDetailRow} className="payment-detail-row">
                    <div style={paymentDetailCard}>
                      <span style={paymentLabel}>Service Fee</span>
                      <span style={paymentValue}>${property.serviceFee || 35}/mo</span>
                    </div>
                  </td>
                </tr>
              </table>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                {availablePlans.length > 1 && (
                  <Button
                    href={`https://landivo.com/properties/${property.id}`}
                    style={morePlansButton}
                    className="button-secondary"
                  >
                    Click Here for More Payment Plans
                  </Button>
                )}
              </div>

              {/* Pre-Qualification Section */}
              <Section style={qualifySection}>
                <div style={qualifyBenefits}>
                  <div style={qualifyBenefit}>✓ Takes About 2 Minutes</div>
                  <div style={qualifyBenefit}>✓ Won't affect your credit score</div>
                  <div style={qualifyBenefit}>✓ See all available payment options</div>
                </div>
                <Button href="https://landivo.com/pre-qualify" style={qualifyButton} className="button-primary">
                  Get Pre-Qualified for All Plans
                </Button>
              </Section>
            </Section>
          )}

          {/* Property Description */}
          <Section style={descriptionSection} className="section-padding">
            <Heading as="h3" style={h3} className="h3-text">📝 Property Description</Heading>
            <div style={descriptionCard}>
              <div dangerouslySetInnerHTML={{ 
                __html: property.description?.substring(0, 400) + '...' || 'No description available' 
              }} style={descriptionText} />
            </div>
          </Section>

          {/* Buyer Guidelines */}
          <Section style={guidelinesSection} className="section-padding">
            <Heading as="h3" style={h3} className="h3-text">📋 Buyer Guidelines</Heading>
            <div style={guidelinesCard}>
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
            </div>
          </Section>

          <Hr style={hr} />

          {/* VIP Signup Section */}
          <Section style={vipSection} className="section-padding">
            <div style={vipContent} className="vip-content">
              <div style={vipIcon}>⭐</div>
              <Heading as="h3" style={vipHeading} className="vip-heading">Join Our VIP List</Heading>
              <Text style={vipDescription}>
                Get early access to the best properties before they hit the market. Receive personalized property alerts tailored to your investment criteria and budget.
              </Text>
              <div style={vipBenefitsList} className="vip-benefits">
                <div style={vipBenefit}>🎯 Properties matched to your exact preferences</div>
                <div style={vipBenefit}>⚡ Early notifications before public listings</div>
                <div style={vipBenefit}>💰 Exclusive deals and financing options</div>
                <div style={vipBenefit}>📞 Direct line to our property specialists</div>
              </div>
              <Button href="https://landivo.com/vip-signup" style={vipButton} className="button-primary">
                Join VIP List - It's Free
              </Button>
              <Text style={vipSubtext}>
                Trusted by 15,000+ investors nationwide
              </Text>
            </div>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer} className="content-padding">
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
  backgroundColor: '#FDF8F2',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
};

const header = {
  padding: '32px 24px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#FDF8F2',
  borderBottom: '1px solid #e5e7eb',
};

const titleStyle = {
  fontSize: '26px',
  fontWeight: 'bold',
  color: '#030001',
  margin: '0',
  lineHeight: '1.3',
};

const h3 = {
  color: '#030001',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const heroImage = {
  width: '100%',
  height: '350px',
  objectFit: 'cover' as const,
  display: 'block',
};

const badgeSection = {
  padding: '24px',
  backgroundColor: '#ffffff',
};

const statusBadge = {
  backgroundColor: '#D4A017',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '24px',
  fontSize: '14px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  display: 'inline-block',
  boxShadow: '0 2px 4px rgba(212, 160, 23, 0.3)',
};

const ctaButton = {
  backgroundColor: '#3f4f24',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '16px 32px',
  display: 'inline-block',
  boxShadow: '0 2px 4px rgba(63, 79, 36, 0.3)',
  transition: 'all 0.3s ease',
};

const highlightsSection = {
  backgroundColor: '#FDF8F2',
  padding: '32px 24px',
  margin: '0',
};

const highlightCell = {
  padding: '16px',
  textAlign: 'center' as const,
  width: '25%',
  verticalAlign: 'top' as const,
};

const highlightIconContainer = {
  width: '56px',
  height: '56px',
  borderRadius: '12px',
  backgroundColor: '#ffffff',
  margin: '0 auto 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  border: '1px solid #e5e7eb',
};

const highlightIcon = {
  fontSize: '24px',
  display: 'block',
};

const highlightValue = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#030001',
  marginBottom: '4px',
  display: 'block',
};

const highlightLabel = {
  fontSize: '13px',
  color: '#6b7280',
  fontWeight: '500',
};

const detailsSection = {
  padding: '24px',
  backgroundColor: '#ffffff',
};

const detailColumn = {
  width: '50%',
  padding: '0 8px',
  verticalAlign: 'top' as const,
};

const detailCard = {
  backgroundColor: '#FDF8F2',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const detailText = {
  fontSize: '14px',
  lineHeight: '1.8',
  color: '#030001',
  margin: '0',
};

const paymentSection = {
  backgroundColor: '#ffffff',
  padding: '32px 24px',
  margin: '24px',
  border: '2px solid #3f4f24',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(63, 79, 36, 0.1)',
};

const paymentHeading = {
  color: '#030001',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};

const paymentCircleContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const paymentCircle = {
  width: '160px',
  height: '160px',
  borderRadius: '50%',
  backgroundColor: '#FDF8F2',
  border: '8px solid #3f4f24',
  display: 'inline-block',
  lineHeight: '144px',
  textAlign: 'center' as const,
  margin: '0 auto',
  boxShadow: '0 8px 24px rgba(63, 79, 36, 0.15)',
};

const paymentCircleInner = {
  display: 'inline-block',
  verticalAlign: 'middle',
  lineHeight: 'normal',
};

const paymentAmount = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#3f4f24',
  lineHeight: '1',
};

const paymentPeriod = {
  fontSize: '16px',
  color: '#3f4f24',
  marginTop: '4px',
  fontWeight: '500',
};

const paymentDetailsTable = {
  width: '100%',
  marginTop: '24px',
  borderCollapse: 'collapse' as const,
};

const paymentDetailRow = {
  padding: '8px',
  verticalAlign: 'top' as const,
};

const paymentDetailCard = {
  backgroundColor: '#FDF8F2',
  padding: '16px',
  borderRadius: '8px',
  textAlign: 'left' as const,
  border: '1px solid #e5e7eb',
};

const paymentLabel = {
  fontSize: '13px',
  fontWeight: '500',
  color: '#6b7280',
  display: 'block',
  marginBottom: '4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const paymentValue = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#030001',
  display: 'block',
};

const qualifySection = {
  backgroundColor: '#e8efdc',
  padding: '24px',
  borderRadius: '8px',
  marginTop: '24px',
  textAlign: 'center' as const,
  border: '1px solid #d1dfb9',
};

const qualifyBenefits = {
  marginBottom: '20px',
};

const qualifyBenefit = {
  color: '#3f4f24',
  fontSize: '15px',
  fontWeight: '500',
  lineHeight: '1.8',
  margin: '4px 0',
};

const qualifyButton = {
  backgroundColor: '#3f4f24',
  color: '#ffffff',
  padding: '16px 40px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: 'bold',
  display: 'inline-block',
  boxShadow: '0 4px 12px rgba(63, 79, 36, 0.25)',
};

const morePlansButton = {
  backgroundColor: '#ffffff',
  color: '#3f4f24',
  padding: '14px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: '600',
  display: 'inline-block',
  border: '2px solid #3f4f24',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease',
};

const descriptionSection = {
  padding: '24px',
  backgroundColor: '#ffffff',
};

const descriptionCard = {
  backgroundColor: '#FDF8F2',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const descriptionText = {
  fontSize: '15px',
  lineHeight: '1.8',
  color: '#030001',
};

const guidelinesSection = {
  padding: '24px',
  backgroundColor: '#ffffff',
};

const guidelinesCard = {
  backgroundColor: '#f9fafb',
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const guidelineText = {
  fontSize: '14px',
  lineHeight: '2',
  color: '#030001',
  margin: '0',
};

// VIP Section Styles
const vipSection = {
  padding: '0 24px 24px',
  backgroundColor: '#ffffff',
};

const vipContent = {
  background: 'linear-gradient(135deg, #3f4f24 0%, #324c48 100%)',
  borderRadius: '12px',
  padding: '48px 32px',
  textAlign: 'center' as const,
  color: '#ffffff',
  position: 'relative' as const,
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(63, 79, 36, 0.2)',
};

const vipIcon = {
  fontSize: '48px',
  marginBottom: '16px',
  display: 'block',
  animation: 'pulse 2s infinite',
};

const vipHeading = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textShadow: '0 2px 8px rgba(0,0,0,0.2)',
  letterSpacing: '-0.5px',
};

const vipDescription = {
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '0 0 28px 0',
  color: 'rgba(255,255,255,0.95)',
  maxWidth: '480px',
  marginLeft: 'auto',
  marginRight: 'auto',
};

const vipBenefitsList = {
  margin: '28px auto 36px',
  textAlign: 'left' as const,
  maxWidth: '400px',
  backgroundColor: 'rgba(255,255,255,0.1)',
  padding: '20px',
  borderRadius: '8px',
  backdropFilter: 'blur(10px)',
};

const vipBenefit = {
  fontSize: '15px',
  lineHeight: '1.8',
  margin: '8px 0',
  color: 'rgba(255,255,255,0.95)',
  fontWeight: '500',
};

const vipButton = {
  backgroundColor: '#D4A017',
  color: '#030001',
  padding: '18px 40px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '18px',
  fontWeight: 'bold',
  display: 'inline-block',
  boxShadow: '0 6px 20px rgba(212, 160, 23, 0.4)',
  border: 'none',
  transition: 'all 0.3s ease',
  marginBottom: '16px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const vipSubtext = {
  fontSize: '14px',
  color: 'rgba(255,255,255,0.8)',
  margin: '16px 0 0 0',
  fontStyle: 'italic',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '40px 24px',
  borderWidth: '1px',
  borderStyle: 'solid',
};

const footer = {
  padding: '24px',
  textAlign: 'center' as const,
  backgroundColor: '#FDF8F2',
};

const footerText = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '0 0 12px 0',
};

const footerLink = {
  fontSize: '13px',
  color: '#D4A017',
  textDecoration: 'underline',
  fontWeight: '500',
};

export default PropertyCampaignEmail;