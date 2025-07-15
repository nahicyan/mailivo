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
  Tailwind,
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
    
    if (firstImagePath.startsWith('http://') || firstImagePath.startsWith('https://')) {
      return firstImagePath;
    }
    
    const baseURL = serverURL.includes('landivo.com') ? serverURL : 'https://landivo.com/api';
    const cleanBaseURL = baseURL.replace(/\/$/, '');
    const cleanImagePath = firstImagePath.replace(/^\//, '');
    
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
      <Preview>{emailSubject}</Preview>
      <Tailwind>
        <Head />
        <Body className="bg-amber-50 font-sans">
          <Container className="bg-white mx-auto p-0 max-w-2xl rounded-lg shadow-lg overflow-hidden">
            
            {/* Header with Rich Text Title */}
            <Section className="px-6 pt-8 pb-6 bg-white">
              <Heading className="text-xl font-semibold text-gray-900 mb-6">Land Details</Heading>
              
              {propertyImage && (
                <div className="mb-6">
                  <Img
                    src={propertyImage}
                    width="600"
                    height="300"
                    alt="Property"
                    className="w-full h-72 object-cover block rounded-lg"
                  />
                </div>
              )}
              
              <div 
                dangerouslySetInnerHTML={{ __html: property.title }} 
                className="text-xl font-semibold text-gray-900 leading-tight mb-2"
              />
              <Text className="text-gray-600 text-base m-0">
                {property.city}, {property.state} {property.zip}
              </Text>
            </Section>

            {/* Property Highlights */}
            <Section className="bg-white px-6 py-6">
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <span className="text-xl">📏</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    {property.sqft?.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">{property.sqft?.toLocaleString()} sqft</div>
                </div>
                
                <div className="text-center p-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <span className="text-xl">🏠</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-1">{property.zoning}</div>
                  <div className="text-xs text-gray-600">Zoning</div>
                </div>
                
                <div className="text-center p-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <span className="text-xl">ℹ️</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-1">Not Available</div>
                  <div className="text-xs text-gray-600">Survey</div>
                </div>
                
                <div className="text-center p-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <span className="text-xl">🕒</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-1">Available</div>
                  <div className="text-xs text-gray-600">Financing</div>
                </div>
              </div>
            </Section>

            {/* Location & Property Details */}
            <Section className="px-6 py-6 bg-white">
              <Row>
                <Column className="w-1/2 pr-4">
                  <Heading className="text-gray-900 text-lg font-semibold mb-4">
                    Location
                  </Heading>
                  <div className="space-y-3">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">County</span>
                      <span className="text-gray-900 font-medium">{property.county}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">State</span>
                      <span className="text-gray-900 font-medium">{property.state}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Zip</span>
                      <span className="text-gray-900 font-medium">{property.zip}</span>
                    </div>
                  </div>
                </Column>
                <Column className="w-1/2 pl-4">
                  <Heading className="text-gray-900 text-lg font-semibold mb-4">
                    Property Details
                  </Heading>
                  <div className="space-y-3">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Size</span>
                      <span className="text-gray-900 font-medium">{property.sqft?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Acreage</span>
                      <span className="text-gray-900 font-medium">{property.acre}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Zoning</span>
                      <span className="text-gray-900 font-medium">{property.zoning}</span>
                    </div>
                  </div>
                </Column>
              </Row>
            </Section>

            {/* Payment Calculator */}
            {property.financing && property.financing !== 'Not-Available' && planDetails && (
              <Section className="bg-white px-6 py-6">
                <Heading className="text-gray-900 text-lg font-semibold mb-6">
                  Payment Calculator
                </Heading>
                
                {/* Payment Circle */}
                <div className="text-center mb-6">
                  <div className="w-48 h-48 rounded-full border-4 border-green-600 inline-flex items-center justify-center bg-white mx-auto">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        ${planDetails.monthly?.toLocaleString()}
                      </div>
                      <div className="text-lg text-green-600 font-medium">/mo</div>
                    </div>
                  </div>
                </div>

                {/* Payment Details Grid - 2x3 layout */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Monthly Payment</span>
                    <span className="text-gray-900 font-semibold">${planDetails.monthly?.toLocaleString()}/mo</span>
                  </div>
                  
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Loan Amount</span>
                    <span className="text-gray-900 font-semibold">${planDetails.loan?.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Down Payment</span>
                    <span className="text-gray-900 font-semibold">${planDetails.down?.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Property Tax</span>
                    <span className="text-gray-900 font-semibold">${Math.round((property.tax || 0) / 12)}/mo</span>
                  </div>
                  
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Interest Rate</span>
                    <span className="text-gray-900 font-semibold">{planDetails.interest}% APR</span>
                  </div>
                  
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="text-gray-900 font-semibold">${property.serviceFee || 35}/mo</span>
                  </div>
                </div>

                {/* Benefits with checkmarks */}
                <div className="mb-6 space-y-2">
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <span>✓</span>
                    <span>Takes About 2 Minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <span>✓</span>
                    <span>Won't affect your credit score</span>
                  </div>
                </div>

                {/* Get Pre-Qualified Button */}
                <Button 
                  href="https://landivo.com/pre-qualify" 
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg text-base font-semibold hover:bg-green-700 transition-colors no-underline text-center"
                >
                  Get Pre-Qualified
                </Button>

                {/* Multiple Plans Button */}
                {availablePlans.length > 1 && (
                  <div className="text-center mt-4">
                    <Button
                      href={`https://landivo.com/properties/${property.id}`}
                      className="bg-white text-green-600 px-6 py-2 rounded-md text-sm font-medium border border-green-600 hover:bg-green-50 transition-colors no-underline"
                    >
                      View More Payment Plans
                    </Button>
                  </div>
                )}
              </Section>
            )}

            {/* Buyer Guidelines */}
            <Section className="px-6 py-6 bg-white">
              <div className="border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
                  <Heading className="text-gray-900 text-lg font-semibold m-0 flex items-center gap-2">
                    📋 Buyer Guidelines
                  </Heading>
                  <span className="text-gray-400">▼</span>
                </div>
                <div className="p-4 bg-white rounded-b-lg">
                  <Text className="text-sm leading-loose text-gray-900 m-0">
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
              </div>
            </Section>

            <Hr className="border-gray-200 my-6 mx-6" />

            {/* Footer */}
            <Section className="px-6 py-4 text-center bg-gray-50">
              <Text className="text-xs text-gray-500 mb-2 m-0">
                You received this email because you're subscribed to property alerts.
              </Text>
              <Link 
                href={`${serverURL}/unsubscribe`} 
                className="text-xs text-blue-600 underline hover:text-blue-700"
              >
                Unsubscribe
              </Link>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PropertyCampaignEmail;