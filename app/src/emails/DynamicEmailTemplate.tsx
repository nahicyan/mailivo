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
import { Header } from './components/Header';
import { PropertyHighlights } from './components/PropertyHighlights';
import { PropertyDetails } from './components/PropertyDetails';
import { PaymentCalculator } from './components/PaymentCalculator';
import { BuyerGuidelines } from './components/BuyerGuidelines';
import { Footer } from './components/Footer';
import { Section } from '@react-email/components';

interface DynamicEmailTemplateProps {
  template: EmailTemplate;
  data: Record<string, any>;
}

export function DynamicEmailTemplate({ template, data }: DynamicEmailTemplateProps) {
  const renderComponent = (component: any) => {
    const props = { ...component.props, ...data };

    switch (component.type) {
      case 'header':
        return <Header key={component.id} {...props} />;
      
      case 'property-highlights':
        return <PropertyHighlights key={component.id} {...props} />;
      
      case 'property-details':
        return <PropertyDetails key={component.id} {...props} />;
      
      case 'payment-calculator':
        return <PaymentCalculator key={component.id} {...props} />;
      
      case 'buyer-guidelines':
        return <BuyerGuidelines key={component.id} {...props} />;
      
      case 'footer':
        return <Footer key={component.id} {...props} />;
      
      case 'spacer':
        return (
          <Section key={component.id} style={{ 
            height: props.height || 20,
            backgroundColor: props.backgroundColor || 'transparent'
          }} />
        );
      
      case 'text':
        return (
          <Section key={component.id} className="px-6 py-4" style={{ backgroundColor: props.backgroundColor }}>
            <div 
              style={{ 
                textAlign: props.textAlign,
                fontSize: props.fontSize + 'px',
                color: props.color
              }}
              dangerouslySetInnerHTML={{ __html: props.content }}
            />
          </Section>
        );
      
      default:
        return null;
    }
  };

  return (
    <Html>
      <Preview>Custom Email Template</Preview>
      <Tailwind>
        <Head />
        <Body style={{ backgroundColor: template.settings.backgroundColor }}>
          <Container className="mx-auto p-0 max-w-2xl rounded-lg shadow-lg overflow-hidden">
            {template.components
              .sort((a, b) => a.order - b.order)
              .map(renderComponent)}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}