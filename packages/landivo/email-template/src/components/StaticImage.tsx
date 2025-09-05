// packages/landivo/email-template/src/components/StaticImage.tsx
import React, { CSSProperties } from 'react';
import { Section, Img, Text, Link } from '@react-email/components';
import { ImageIcon, Upload, Link as LinkIcon, Image as ImageGallery } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface StaticImageProps {
  className?: string;
  backgroundColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  spacing?: number;
  
  // Image source options
  imageSource?: 'upload' | 'url' | 'gallery';
  imageUrl?: string;
  uploadedImageId?: string;
  
  // Image properties
  altText?: string;
  width?: number;
  height?: number | 'auto';
  maxWidth?: number;
  
  // Responsive settings
  mobileWidth?: number;
  mobileHeight?: number | 'auto';
  
  // Display options
  alignment?: 'left' | 'center' | 'right';
  showCaption?: boolean;
  caption?: string;
  captionAlignment?: 'left' | 'center' | 'right';
  
  // Link options
  linkUrl?: string;
  linkTarget?: '_blank' | '_self';
  
  // Border and styling
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  shadow?: boolean;
  shadowIntensity?: 'light' | 'medium' | 'heavy';
  
  // Background options
  backgroundPadding?: number;
  backgroundShape?: 'rectangle' | 'rounded' | 'circle';
  
  // Upload gallery state (for component builder)
  uploadedImages?: Array<{
    id: string;
    url: string;
    name: string;
    size: number;
    format: string;
    uploadedAt: string;
  }>;
}

export function StaticImage({
  className = '',
  backgroundColor = 'transparent',
  borderRadius = 0,
  showBorder = false,
  spacing = 20,
  
  // Image source
  imageSource = 'url',
  imageUrl = 'https://via.placeholder.com/600x400/f3f4f6/6b7280?text=Add+Your+Image',
  uploadedImageId = '',
  
  // Image properties
  altText = 'Static Image',
  width = 600,
  height = 400,
  maxWidth = 600,
  
  // Responsive
  mobileWidth = 320,
  mobileHeight = 'auto',
  
  // Display
  alignment = 'center',
  showCaption = false,
  caption = '',
  captionAlignment = 'center',
  
  // Link
  linkUrl = '',
  linkTarget = '_blank',
  
  // Border and styling
  borderWidth = 0,
  borderColor = '#e5e7eb',
  borderStyle = 'solid',
  shadow = false,
  shadowIntensity = 'light',
  
  // Background
  backgroundPadding = 0,
  backgroundShape = 'rectangle',
  
  // Upload gallery
  uploadedImages = []
}: StaticImageProps) {

  // Determine the image URL to use
  const getImageUrl = () => {
    switch (imageSource) {
      case 'upload':
        if (uploadedImageId && uploadedImages.length > 0) {
          const uploadedImage = uploadedImages.find(img => img.id === uploadedImageId);
          return uploadedImage?.url || imageUrl;
        }
        return imageUrl;
      case 'gallery':
        // Would integrate with your image gallery system
        return imageUrl;
      case 'url':
      default:
        return imageUrl || 'https://via.placeholder.com/600x400/f3f4f6/6b7280?text=Add+Your+Image';
    }
  };

  const displayImageUrl = getImageUrl();
  const displayCaption = caption?.trim();

  // Container styles
  const containerStyle: CSSProperties = {
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: showBorder ? '1px solid #e5e7eb' : 'none',
    padding: `${spacing}px`,
    margin: '0',
  };

  // Image wrapper styles for alignment and background
  const imageWrapperStyle: CSSProperties = {
    textAlign: alignment,
    padding: backgroundPadding > 0 ? `${backgroundPadding}px` : '0',
    backgroundColor: backgroundPadding > 0 ? backgroundColor : 'transparent',
    borderRadius: backgroundShape === 'rounded' ? '8px' : 
                  backgroundShape === 'circle' ? '50%' : '0',
    display: 'inline-block',
    maxWidth: '100%',
  };

  // Image styles
  const imageStyle: CSSProperties = {
    width: `${width}px`,
    height: height === 'auto' ? 'auto' : `${height}px`,
    maxWidth: maxWidth ? `${maxWidth}px` : '100%',
    display: 'block',
    margin: alignment === 'center' ? '0 auto' : 
            alignment === 'right' ? '0 0 0 auto' : '0',
    borderRadius: `${borderRadius}px`,
    border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
    objectFit: 'cover',
    boxShadow: shadow ? 
      shadowIntensity === 'light' ? '0 1px 3px rgba(0, 0, 0, 0.12)' :
      shadowIntensity === 'medium' ? '0 4px 6px rgba(0, 0, 0, 0.1)' :
      '0 10px 15px rgba(0, 0, 0, 0.1)' : 'none',
  };

  // Mobile responsive styles (using media queries in style tags)
  const responsiveStyles = `
    @media only screen and (max-width: 600px) {
      .static-image-responsive {
        width: ${mobileWidth}px !important;
        height: ${mobileHeight === 'auto' ? 'auto' : `${mobileHeight}px`} !important;
        max-width: 100% !important;
      }
    }
  `;

  // Caption styles
  const captionStyle: CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '8px',
    textAlign: captionAlignment,
    fontStyle: 'italic',
    lineHeight: '1.4',
  };

  // Image content
  const imageContent = (
    <div style={imageWrapperStyle}>
      <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />
      <Img
        src={displayImageUrl}
        alt={altText}
        className="static-image-responsive"
        style={imageStyle}
      />
      {showCaption && displayCaption && (
        <Text style={captionStyle}>
          {displayCaption}
        </Text>
      )}
    </div>
  );

  return (
    <Section style={containerStyle} className={className}>
      {linkUrl ? (
        <Link href={linkUrl} target={linkTarget} style={{ textDecoration: 'none' }}>
          {imageContent}
        </Link>
      ) : (
        imageContent
      )}
    </Section>
  );
}

// Component metadata for the template builder
export const staticImageMetadata: EmailComponentMetadata = {
  type: 'static-image',
  name: 'static-image',
  displayName: 'Static Image',
  version: 'v1.0',
  icon: <ImageIcon className="w-5 h-5" />,
  description: 'Upload, select, or link to images with full customization and email optimization',
  category: 'media',
  available: true,
  defaultProps: {
    className: '',
    backgroundColor: 'transparent',
    borderRadius: 0,
    showBorder: false,
    spacing: 20,
    
    // Image source
    imageSource: 'url',
    imageUrl: 'https://via.placeholder.com/600x400/f3f4f6/6b7280?text=Add+Your+Image',
    uploadedImageId: '',
    
    // Image properties
    altText: 'Static Image',
    width: 600,
    height: 400,
    maxWidth: 600,
    
    // Responsive
    mobileWidth: 320,
    mobileHeight: 'auto',
    
    // Display
    alignment: 'center',
    showCaption: false,
    caption: '',
    captionAlignment: 'center',
    
    // Link
    linkUrl: '',
    linkTarget: '_blank',
    
    // Border and styling
    borderWidth: 0,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    shadow: false,
    shadowIntensity: 'light',
    
    // Background
    backgroundPadding: 0,
    backgroundShape: 'rectangle',
    
    // Upload gallery
    uploadedImages: []
  },
  configFields: [
    // Image Source Section
    {
      key: 'imageSource',
      label: 'Image Source',
      type: 'select',
      options: [
        { label: 'Upload New Image', value: 'upload' },
        { label: 'Image URL', value: 'url' },
        { label: 'Image Gallery', value: 'gallery' }
      ],
      defaultValue: 'url',
      description: 'Choose how to add your image'
    },
    {
      key: 'imageUrl',
      label: 'Image URL',
      type: 'text',
      placeholder: 'https://example.com/image.jpg',
      description: 'Direct link to your image'
    },
    {
      key: 'uploadedImageId',
      label: 'Uploaded Image',
      type: 'select',
      options: [],
      description: 'Select from uploaded images'
    },
    
    // Image Properties Section
    {
      key: 'altText',
      label: 'Alt Text',
      type: 'text',
      placeholder: 'Describe your image',
      required: true,
      description: 'Important for accessibility and email clients'
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
      label: 'Height',
      type: 'select',
      options: [
        { label: 'Auto (maintain ratio)', value: 'auto' },
        { label: 'Custom height', value: 'custom' }
      ],
      defaultValue: 'auto',
      description: 'Image height setting'
    },
    {
      key: 'maxWidth',
      label: 'Max Width (px)',
      type: 'number',
      defaultValue: 600,
      description: 'Maximum width for responsiveness'
    },
    
    // Responsive Section
    {
      key: 'mobileWidth',
      label: 'Mobile Width (px)',
      type: 'number',
      defaultValue: 320,
      description: 'Width on mobile devices'
    },
    
    // Display Options Section
    {
      key: 'alignment',
      label: 'Alignment',
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ],
      defaultValue: 'center',
      description: 'Image alignment in email'
    },
    {
      key: 'showCaption',
      label: 'Show Caption',
      type: 'boolean',
      defaultValue: false,
      description: 'Display caption below image'
    },
    {
      key: 'caption',
      label: 'Caption Text',
      type: 'textarea',
      placeholder: 'Enter image caption',
      description: 'Caption text below image'
    },
    {
      key: 'captionAlignment',
      label: 'Caption Alignment',
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ],
      defaultValue: 'center',
      description: 'Caption text alignment'
    },
    
    // Link Section
    {
      key: 'linkUrl',
      label: 'Link URL',
      type: 'text',
      placeholder: 'https://example.com',
      description: 'Make image clickable (optional)'
    },
    {
      key: 'linkTarget',
      label: 'Link Target',
      type: 'select',
      options: [
        { label: 'New Tab', value: '_blank' },
        { label: 'Same Tab', value: '_self' }
      ],
      defaultValue: '_blank',
      description: 'How to open the link'
    },
    
    // Border & Styling Section
    {
      key: 'borderWidth',
      label: 'Border Width (px)',
      type: 'number',
      defaultValue: 0,
      description: 'Image border thickness'
    },
    {
      key: 'borderColor',
      label: 'Border Color',
      type: 'color',
      defaultValue: '#e5e7eb',
      description: 'Border color'
    },
    {
      key: 'borderStyle',
      label: 'Border Style',
      type: 'select',
      options: [
        { label: 'Solid', value: 'solid' },
        { label: 'Dashed', value: 'dashed' },
        { label: 'Dotted', value: 'dotted' }
      ],
      defaultValue: 'solid',
      description: 'Border line style'
    },
    {
      key: 'shadow',
      label: 'Drop Shadow',
      type: 'boolean',
      defaultValue: false,
      description: 'Add shadow effect'
    },
    {
      key: 'shadowIntensity',
      label: 'Shadow Intensity',
      type: 'select',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Medium', value: 'medium' },
        { label: 'Heavy', value: 'heavy' }
      ],
      defaultValue: 'light',
      description: 'Shadow intensity level'
    },
    
    // Background Section
    {
      key: 'backgroundPadding',
      label: 'Background Padding (px)',
      type: 'number',
      defaultValue: 0,
      description: 'Padding around image'
    },
    {
      key: 'backgroundShape',
      label: 'Background Shape',
      type: 'select',
      options: [
        { label: 'Rectangle', value: 'rectangle' },
        { label: 'Rounded', value: 'rounded' },
        { label: 'Circle', value: 'circle' }
      ],
      defaultValue: 'rectangle',
      description: 'Background container shape'
    },
    
    // Container Section
    {
      key: 'backgroundColor',
      label: 'Container Background',
      type: 'color',
      defaultValue: 'transparent',
      description: 'Container background color'
    },
    {
      key: 'borderRadius',
      label: 'Container Border Radius (px)',
      type: 'number',
      defaultValue: 0,
      description: 'Container corner rounding'
    },
    {
      key: 'spacing',
      label: 'Container Padding (px)',
      type: 'number',
      defaultValue: 20,
      description: 'Space inside container'
    },
    {
      key: 'showBorder',
      label: 'Container Border',
      type: 'boolean',
      defaultValue: false,
      description: 'Show container border'
    }
  ],
  component: StaticImage
};