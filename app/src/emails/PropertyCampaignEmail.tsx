// app/src/emails/PropertyCampaignEmail.tsx
import React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';
import { Header } from './components/Header';

interface PropertyData {
  title?: string;
  askingPrice?: number;
  streetAddress?: string;
  city?: string;
  state?: string;
  description?: string;
}

interface PropertyCampaignEmailProps {
  property: PropertyData;
}

export function PropertyCampaignEmail({ 
  property
}: PropertyCampaignEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New Property Alert from Landivo</Preview>
      <Tailwind>
        <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
          <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <Header />
            
            <Section style={{ padding: '20px 0' }}>
              <Text style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
                {property.title}
              </Text>
              
              <Text style={{ fontSize: '18px', color: '#059669', fontWeight: 'bold', marginBottom: '10px' }}>
                ${property.askingPrice?.toLocaleString()}
              </Text>
              
              <Text style={{ fontSize: '16px', color: '#6b7280', marginBottom: '15px' }}>
                {property.streetAddress}, {property.city}, {property.state}
              </Text>
              
              <Text style={{ fontSize: '14px', lineHeight: '1.5', color: '#374151' }}>
                {property.description}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default PropertyCampaignEmail;