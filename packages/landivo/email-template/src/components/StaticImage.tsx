// packages/landivo/email-template/src/components/StaticImage.tsx
import React from 'react';
import { Section, Img, Text, Link } from '@react-email/components';
import { Image as ImageIcon } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface StaticImageProps {
  className?: string;
  imageUrl?: string;
  altText?: string;
  width?: number;
  height?: number;
  alignment?: 'left' | 'center' | 'right';
  linkUrl?: string;
  borderRadius?: number;
  margin?: string;
  padding?: string;
  backgroundColor?: string;
  caption?: string;
  showCaption?: boolean;
  borderColor?: string;
  borderWidth?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function StaticImage({
  className = '',
  imageUrl = '',
  altText = 'Image',
  width = 600,
  height = 400,
  alignment = 'center',
  linkUrl = '',
  borderRadius = 0,
  margin = '0',
  padding = '16px 0',
  backgroundColor = 'transparent',
  caption = '',
  showCaption = false,
  borderColor = '#e5e7eb',
  borderWidth = 0,
  objectFit = 'cover'
}: StaticImageProps) {
  
  const getImageSrc = () => {
    if (imageUrl) {
      if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';
        return imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
      }
      return imageUrl;
    }
    return 'https://via.placeholder.com/600x400/e5e7eb/6b7280?text=Click+to+upload+image';
  };

  const imageSrc = getImageSrc();

  // Alignment styles
  const getAlignmentStyle = (): React.CSSProperties => {
    switch (alignment) {
      case 'left':
        return { textAlign: 'left' };
      case 'right':
        return { textAlign: 'right' };
      default:
        return { textAlign: 'center' };
    }
  };

  // Image container styles
  const containerStyle: React.CSSProperties = {
    backgroundColor,
    padding,
    margin,
    minHeight: '100px', 
    ...getAlignmentStyle()
  };

  // Image styles
  const imageStyle: React.CSSProperties = {
    width: `${width}px`,
    height: height ? `${height}px` : 'auto',
    minHeight: '100px',
    maxWidth: '100%',
    display: alignment === 'center' ? 'block' : 'inline-block',
    margin: alignment === 'center' ? '0 auto' : '0',
    borderRadius: `${borderRadius}px`,
    border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
    objectFit: objectFit as any
  };

  const imageElement = (
    <Img
      src={imageSrc}
      alt={altText}
      width={width}
      height={height}
      style={imageStyle}
    />
  );

  const captionElement = showCaption && caption && (
    <Text
      style={{
        fontSize: '14px',
        color: '#6b7280',
        marginTop: '8px',
        textAlign: alignment,
        fontStyle: 'italic'
      }}
    >
      {caption}
    </Text>
  );

  return (
    <Section className={className} style={containerStyle}>
      <div>
        {linkUrl ? (
          <Link href={linkUrl} target="_blank" style={{ textDecoration: 'none' }}>
            {imageElement}
          </Link>
        ) : (
          imageElement
        )}
        {captionElement}
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const staticImageMetadata: EmailComponentMetadata = {
  type: 'static-image',
  templateType: 'any',
  name: 'static-image',
  displayName: 'Static Image',
  version: 'v1.0',
  icon: <ImageIcon className="w-5 h-5" />,
  description: 'Add images via URL or upload',
  category: 'media',
  available: true,
  defaultProps: {
    className: '',
    imageUrl: '',
    altText: 'Image',
    width: 600,
    height: 400,
    alignment: 'center',
    linkUrl: '',
    borderRadius: 0,
    margin: '0',
    padding: '16px 0',
    backgroundColor: 'transparent',
    caption: '',
    showCaption: false,
    borderColor: '#e5e7eb',
    borderWidth: 0,
    objectFit: 'cover'
  },
  configFields: [
    {
      key: 'imageUrl',
      label: 'Image URL',
      type: 'text',
      placeholder: 'https://example.com/image.jpg',
      description: 'URL of the image to display'
    },
    {
      key: 'linkUrl',
      label: 'Link URL',
      type: 'text',
      placeholder: 'https://example.com',
      description: 'Optional link when image is clicked'
    },
    {
      key: 'alignment',
      label: 'Alignment',
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ],
      defaultValue: 'center'
    },
    {
      key: 'width',
      label: 'Width (px)',
      type: 'number',
      defaultValue: 600,
      min: 100,
      max: 800
    },
    {
      key: 'height',
      label: 'Height (px)',
      type: 'number',
      placeholder: 'Auto',
      min: 50,
      max: 1000
    },
    {
      key: 'objectFit',
      label: 'Object Fit',
      type: 'select',
      options: [
        { label: 'Cover', value: 'cover' },
        { label: 'Contain', value: 'contain' },
        { label: 'Fill', value: 'fill' },
        { label: 'None', value: 'none' },
        { label: 'Scale Down', value: 'scale-down' }
      ],
      defaultValue: 'cover'
    },
    {
      key: 'borderRadius',
      label: 'Border Radius (px)',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 50
    },
    {
      key: 'borderWidth',
      label: 'Border Width (px)',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 10
    },
    {
      key: 'borderColor',
      label: 'Border Color',
      type: 'color',
      defaultValue: '#e5e7eb'
    },
    {
      key: 'altText',
      label: 'Alt Text',
      type: 'text',
      defaultValue: 'Image',
      description: 'Alternative text for accessibility'
    },
    {
      key: 'caption',
      label: 'Caption',
      type: 'text',
      placeholder: 'Enter image caption',
      description: 'Caption text below the image'
    },
    {
      key: 'showCaption',
      label: 'Show Caption',
      type: 'toggle',
      defaultValue: false
    },
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: 'transparent'
    },
    {
      key: 'padding',
      label: 'Padding',
      type: 'text',
      defaultValue: '16px 0',
      placeholder: '16px 0'
    },
    {
      key: 'margin',
      label: 'Margin',
      type: 'text',
      defaultValue: '0',
      placeholder: '0'
    }
  ],
  component: StaticImage
};

export default StaticImage;