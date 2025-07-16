// app/src/emails/components/Header.tsx
import {
  Section,
  Heading,
  Text,
  Img,
} from '@react-email/components';

interface HeaderProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  backgroundColor?: string;
}

export function Header({ title, subtitle, imageUrl, backgroundColor = 'white' }: HeaderProps) {
  return (
    <Section className={`px-6 pt-8 pb-6`} style={{ backgroundColor }}>
      <Heading className="text-xl font-semibold text-gray-900 mb-6">Land Details</Heading>
      
      {imageUrl && (
        <div className="mb-6">
          <Img
            src={imageUrl}
            width="600"
            height="300"
            alt="Property"
            className="w-full h-72 object-cover block rounded-lg"
          />
        </div>
      )}
      
      <div 
        dangerouslySetInnerHTML={{ __html: title }} 
        className="text-xl font-semibold text-gray-900 leading-tight mb-2"
      />
      {subtitle && (
        <Text className="text-gray-600 text-base m-0">
          {subtitle}
        </Text>
      )}
    </Section>
  );
}