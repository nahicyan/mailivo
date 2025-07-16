// app/src/emails/components/Footer.tsx
import { Section, Text, Link, Hr } from '@react-email/components';

interface FooterProps {
  unsubscribeUrl: string;
  backgroundColor?: string;
  companyName?: string;
}

export function Footer({ 
  unsubscribeUrl, 
  backgroundColor = '#f9fafb',
  companyName = "Landivo"
}: FooterProps) {
  return (
    <>
      <Hr className="border-gray-200 my-6 mx-6" />
      <Section className="px-6 py-4 text-center" style={{ backgroundColor }}>
        <Text className="text-xs text-gray-500 mb-2 m-0">
          You received this email because you're subscribed to property alerts from {companyName}.
        </Text>
        <Link 
          href={unsubscribeUrl} 
          className="text-xs text-blue-600 underline hover:text-blue-700"
        >
          Unsubscribe
        </Link>
      </Section>
    </>
  );
}