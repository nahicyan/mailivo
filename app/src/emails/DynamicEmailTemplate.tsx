// app/src/emails/DynamicEmailTemplate.tsx
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Tailwind,
} from '@react-email/components';
import { EmailTemplate } from '@/types/template';
import { LandivoProperty } from '@/types/landivo';
import { Header } from './components/Header';
import { PropertyHighlights } from './components/PropertyHighlights';
import { PropertyDetails } from './components/PropertyDetails';
import { PaymentCalculator } from './components/PaymentCalculator';
import { BuyerGuidelines } from './components/BuyerGuidelines';
import { Footer } from './components/Footer';
import { Section } from '@react-email/components';

interface DynamicEmailTemplateProps {
  template: EmailTemplate;
  data: LandivoProperty | Record<string, any>;
}

export function DynamicEmailTemplate({ template, data }: DynamicEmailTemplateProps) {
  // Ensure we have consistent property data structure
  const propertyData = data ? {
    // Property basic info
    id: data.id || 'sample-id',
    title: data.title || 'Sample Property Title',
    streetAddress: data.streetAddress || '123 Sample Street',
    city: data.city || 'Sample City',
    state: data.state || 'TX',
    zip: data.zip || '12345',
    county: data.county || 'Sample County',
    
    // Property details
    sqft: data.sqft || 21154,
    acre: data.acre || 0.5,
    zoning: data.zoning || 'Residential',
    landType: data.landType || ['Residential'],
    
    // Pricing
    askingPrice: data.askingPrice || 45000,
    monthlyPaymentOne: data.monthlyPaymentOne || 299,
    downPaymentOne: data.downPaymentOne || 10000,
    loanAmountOne: data.loanAmountOne || 35000,
    interestOne: data.interestOne || 9.5,
    tax: data.tax || 1200,
    serviceFee: data.serviceFee || 35,
    
    // Additional fields
    financing: data.financing || 'Available',
    description: data.description || 'Beautiful property with great potential.',
    status: data.status || 'Available',
    
    // Images
    imageUrls: data.imageUrls || '[]',
    
    // Get first image URL if available
    primaryImageUrl: (() => {
      try {
        if (!data.imageUrls) return null;
        const images = Array.isArray(data.imageUrls) 
          ? data.imageUrls 
          : JSON.parse(data.imageUrls);
        return images.length > 0 ? `https://api.landivo.com/${images[0]}` : null;
      } catch {
        return null;
      }
    })(),
    
    // Timestamps
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  } : null;

  const renderComponent = (component: any) => {
    // Merge component props with property data
    const props = { 
      ...component.props, 
      ...propertyData,
      // Ensure we pass the server URL for images
      serverURL: 'https://api.landivo.com'
    };

    switch (component.type) {
      case 'header':
        return (
          <Header 
            key={component.id} 
            title={props.title || propertyData?.title}
            subtitle={`${propertyData?.city}, ${propertyData?.state}`}
            imageUrl={props.imageUrl || propertyData?.primaryImageUrl}
            backgroundColor={props.backgroundColor}
            {...props} 
          />
        );
      
      case 'property-highlights':
        return (
          <PropertyHighlights 
            key={component.id} 
            sqft={propertyData?.sqft}
            acre={propertyData?.acre}
            zoning={propertyData?.zoning}
            askingPrice={propertyData?.askingPrice}
            financing={propertyData?.financing}
            {...props} 
          />
        );
      
      case 'property-details':
        return (
          <PropertyDetails 
            key={component.id} 
            streetAddress={propertyData?.streetAddress}
            city={propertyData?.city}
            state={propertyData?.state}
            zip={propertyData?.zip}
            county={propertyData?.county}
            description={propertyData?.description}
            {...props} 
          />
        );
      
      case 'payment-calculator':
        return (
          <PaymentCalculator 
            key={component.id} 
            monthlyPayment={propertyData?.monthlyPaymentOne}
            downPayment={propertyData?.downPaymentOne}
            loanAmount={propertyData?.loanAmountOne}
            interestRate={propertyData?.interestOne}
            {...props} 
          />
        );
      
      case 'buyer-guidelines':
        return <BuyerGuidelines key={component.id} {...props} />;
      
      case 'footer':
        return <Footer key={component.id} {...props} />;
      
      case 'spacer':
        return (
          <Section 
            key={component.id} 
            style={{ 
              height: props.height || 20,
              backgroundColor: props.backgroundColor || 'transparent'
            }} 
          />
        );
      
      case 'text':
        return (
          <Section key={component.id} className="px-6 py-4" style={{ backgroundColor: props.backgroundColor }}>
            <div 
              style={{ 
                textAlign: props.textAlign || 'left',
                fontSize: (props.fontSize || 14) + 'px',
                color: props.color || '#000000',
                lineHeight: '1.5'
              }}
              dangerouslySetInnerHTML={{ 
                __html: props.content || 'Add your text content here...' 
              }}
            />
          </Section>
        );
      
      default:
        return (
          <Section key={component.id} className="px-6 py-4">
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              Unknown component type: {component.type}
            </div>
          </Section>
        );
    }
  };

  // Generate preview text based on property data
  const previewText = propertyData 
    ? `🔥 Great Property in ${propertyData.city}, ${propertyData.state} - ${propertyData.title}`
    : 'Real Estate Email Template Preview';

  return (
    <Html>
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Head />
        <Body style={{ 
          backgroundColor: template.settings?.backgroundColor || '#f9fafb',
          fontFamily: template.settings?.fontFamily || 'Arial, sans-serif',
          margin: 0,
          padding: 0
        }}>
          <Container 
            className="mx-auto p-0 max-w-2xl rounded-lg shadow-lg overflow-hidden"
            style={{ 
              backgroundColor: '#ffffff',
              maxWidth: '640px'
            }}
          >
            {/* Debug info (only in development) */}
            {process.env.NODE_ENV === 'development' && propertyData && (
              <Section style={{ 
                backgroundColor: '#e0f2fe', 
                padding: '8px 16px', 
                fontSize: '12px', 
                color: '#0277bd',
                borderBottom: '1px solid #b3e5fc'
              }}>
                <div>Using property: {propertyData.streetAddress}, {propertyData.city}, {propertyData.state}</div>
              </Section>
            )}
            
            {template.components
              .sort((a, b) => a.order - b.order)
              .map(renderComponent)}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}