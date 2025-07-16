// app/src/emails/components/BuyerGuidelines.tsx
import { Section, Heading, Text } from '@react-email/components';

interface BuyerGuidelinesProps {
  guidelines: string[];
  backgroundColor?: string;
  title?: string;
}

export function BuyerGuidelines({ 
  guidelines, 
  backgroundColor = 'white',
  title = "Buyer Guidelines"
}: BuyerGuidelinesProps) {
  return (
    <Section className="px-6 py-6" style={{ backgroundColor }}>
      <div className="border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
          <Heading className="text-gray-900 text-lg font-semibold m-0 flex items-center gap-2">
            📋 {title}
          </Heading>
          <span className="text-gray-400">▼</span>
        </div>
        <div className="p-4 bg-white rounded-b-lg">
          <Text className="text-sm leading-loose text-gray-900 m-0">
            {guidelines.map((guideline, index) => (
              <span key={index}>
                • {guideline}
                {index < guidelines.length - 1 && <br />}
              </span>
            ))}
          </Text>
        </div>
      </div>
    </Section>
  );
}