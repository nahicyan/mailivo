// app/src/emails/components/PropertyDetails.tsx
import { Section, Heading, Row, Column } from '@react-email/components';

interface DetailItem {
  label: string;
  value: string;
}

interface PropertyDetailsProps {
  locationDetails: DetailItem[];
  propertyDetails: DetailItem[];
  backgroundColor?: string;
}

export function PropertyDetails({ 
  locationDetails, 
  propertyDetails, 
  backgroundColor = 'white' 
}: PropertyDetailsProps) {
  return (
    <Section className="px-6 py-6" style={{ backgroundColor }}>
      <Row>
        <Column className="w-1/2 pr-4">
          <Heading className="text-gray-900 text-lg font-semibold mb-4">
            Location
          </Heading>
          <div className="space-y-3">
            {locationDetails.map((detail, index) => (
              <div key={index} className="flex justify-between py-1">
                <span className="text-gray-600">{detail.label}</span>
                <span className="text-gray-900 font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        </Column>
        <Column className="w-1/2 pl-4">
          <Heading className="text-gray-900 text-lg font-semibold mb-4">
            Property Details
          </Heading>
          <div className="space-y-3">
            {propertyDetails.map((detail, index) => (
              <div key={index} className="flex justify-between py-1">
                <span className="text-gray-600">{detail.label}</span>
                <span className="text-gray-900 font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        </Column>
      </Row>
    </Section>
  );
}