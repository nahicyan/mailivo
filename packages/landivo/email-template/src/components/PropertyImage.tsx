// app/src/emails/components/PropertyImage.tsx
import React from 'react';
import { Img, Section, Text } from '@react-email/components';
import { Image } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface PropertyImageProps {
  className?: string;
  imageIndex?: number;
  imageUrl?: string;
  altText?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  showCaption?: boolean;
  caption?: string;
  imageUrls?: string[];
  propertyData?: any;
}

export function PropertyImage({ 
  className = '',
  imageIndex = 0,
  imageUrl = '',
  altText = 'Property Image',
  width = 600,
  height = 400,
  borderRadius = 8,
  showCaption = false,
  caption = '',
  imageUrls = [],
  propertyData
}: PropertyImageProps) {
  // Determine the image source
  const getImageSrc = () => {
    if (imageUrl) return imageUrl;
    
    // Use property data if available
    const availableImages = propertyData?.imageUrls || imageUrls;
    if (availableImages && availableImages.length > 0 && imageIndex < availableImages.length) {
      const imagePath = availableImages[imageIndex];
      return `https://api.landivo.com/${imagePath}`;
    }
    
    return 'https://via.placeholder.com/600x400/e5e7eb/6b7280?text=No+Image+Available';
  };

  // Auto-generate caption from property data if not set
  const getCaption = () => {
    if (caption) return caption;
    if (propertyData && showCaption) {
      return `${propertyData.streetAddress}, ${propertyData.city}, ${propertyData.state}`;
    }
    return '';
  };

  const imageSrc = getImageSrc();
  const displayCaption = getCaption();

  return (
    <Section
      className={className}
      style={{
        width: '100%',
        // padding: '16px 0',
        textAlign: 'center',
      }}
    >
      <div style={{ textAlign: 'center', margin: '0 auto' }}>
        <Img
          src={imageSrc}
          alt={altText}
          width={width}
          height={height}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            maxWidth: '100%',
            display: 'block',
            margin: '0 auto',
            borderRadius: `${borderRadius}px`,
            border: '1px solid #e5e7eb',
            objectFit: 'cover',
          }}
        />
        {showCaption && displayCaption && (
          <Text
            style={{
              fontSize: '14px',
              color: '#6b7280',
              marginTop: '8px',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            {displayCaption}
          </Text>
        )}
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const propertyImageMetadata: EmailComponentMetadata = {
  type: 'property-image',
    templateType: 'single',
  name: 'property-image',
  displayName: 'Property Image',
  version: 'v1.0',
  icon: <Image className="w-5 h-5" />,
  description: 'Display property photos with captions',
  category: 'media',
  available: true,
  defaultProps: {
    className: '',
    imageIndex: 0,
    imageUrl: '',
    altText: 'Property Image',
    width: 600,
    height: 400,
    borderRadius: 8,
    showCaption: false,
    caption: '',
    imageUrls: []
  },
  configFields: [
    {
      key: 'imageSource',
      label: 'Image Source',
      type: 'select',
      options: [
        { label: 'From Property Data', value: 'property' },
        { label: 'Custom URL', value: 'custom' }
      ],
      defaultValue: 'property',
      description: 'Choose image source'
    },
    {
      key: 'imageIndex',
      label: 'Property Image #',
      type: 'select',
      options: [
        { label: 'Image 1', value: '0' },
        { label: 'Image 2', value: '1' },
        { label: 'Image 3', value: '2' },
        { label: 'Image 4', value: '3' },
        { label: 'Image 5', value: '4' }
      ],
      defaultValue: '0',
      description: 'Select which property image to display'
    },
    {
      key: 'imageUrl',
      label: 'Custom Image URL',
      type: 'text',
      placeholder: 'https://example.com/image.jpg',
      description: 'Enter custom image URL (overrides property images)'
    },
    {
      key: 'width',
      label: 'Width (px)',
      type: 'number',
      defaultValue: 600,
      description: 'Image width in pixels'
    },
    {
      key: 'height',
      label: 'Height (px)',
      type: 'number',
      defaultValue: 400,
      description: 'Image height in pixels'
    },
    {
      key: 'borderRadius',
      label: 'Border Radius (px)',
      type: 'number',
      defaultValue: 8,
      description: 'Corner rounding in pixels'
    },
    {
      key: 'altText',
      label: 'Alt Text',
      type: 'text',
      placeholder: 'Property Image',
      defaultValue: 'Property Image',
      description: 'Alternative text for accessibility'
    },
    {
      key: 'showCaption',
      label: 'Show Caption',
      type: 'toggle',
      defaultValue: false,
      description: 'Display caption below image'
    },
    {
      key: 'caption',
      label: 'Caption Text',
      type: 'text',
      placeholder: 'Image caption...',
      description: 'Text to display below image'
    }
  ],
  component: PropertyImage
};

export default PropertyImage;