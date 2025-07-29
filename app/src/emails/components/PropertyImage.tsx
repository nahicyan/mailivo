// app/src/emails/components/PropertyImage.tsx
import React, { useState, useEffect } from 'react';
import {
  Img,
  Section,
  Text,
  Link,
} from '@react-email/components';

interface PropertyImageProps {
  // Property data
  imageUrls?: string | string[];
  title?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  serverURL?: string;
  
  // Component props
  selectedImageIndex?: number;
  width?: string;
  height?: string;
  alt?: string;
  borderRadius?: string;
  showCaption?: boolean;
  captionText?: string;
  linkToProperty?: boolean;
  propertyUrl?: string;
  
  // Style props
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  
  // Editor mode (for dropdown selection)
  isEditorMode?: boolean;
  onImageSelect?: (index: number) => void;
}

export function PropertyImage({
  imageUrls = '[]',
  title = '',
  streetAddress = '',
  city = '',
  state = '',
  serverURL = 'https://api.landivo.com',
  selectedImageIndex = 0,
  width = '100%',
  height = 'auto',
  alt,
  borderRadius = '8px',
  showCaption = true,
  captionText,
  linkToProperty = false,
  propertyUrl = '#',
  backgroundColor = 'transparent',
  padding = '0',
  margin = '0 0 20px 0',
  isEditorMode = false,
  onImageSelect,
}: PropertyImageProps) {
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(selectedImageIndex);
  const [imageError, setImageError] = useState(false);

  // Parse image URLs
  useEffect(() => {
    try {
      let images: string[] = [];
      
      if (Array.isArray(imageUrls)) {
        images = imageUrls;
      } else if (typeof imageUrls === 'string') {
        if (imageUrls.trim().startsWith('[')) {
          images = JSON.parse(imageUrls);
        } else {
          images = [imageUrls];
        }
      }
      
      setAvailableImages(images);
      setImageError(false);
    } catch (error) {
      console.error('Error parsing image URLs:', error);
      setAvailableImages([]);
      setImageError(true);
    }
  }, [imageUrls]);

  // Update current image index when prop changes
  useEffect(() => {
    setCurrentImageIndex(selectedImageIndex);
  }, [selectedImageIndex]);

  // Get current image URL
  const getCurrentImageUrl = () => {
    if (availableImages.length === 0) return null;
    const imageIndex = Math.min(currentImageIndex, availableImages.length - 1);
    const imagePath = availableImages[imageIndex];
    return imagePath ? `${serverURL}/${imagePath}` : null;
  };

  // Handle image selection in editor mode
  const handleImageSelect = (index: number) => {
    setCurrentImageIndex(index);
    if (onImageSelect) {
      onImageSelect(index);
    }
  };

  // Generate caption text
  const getCaption = () => {
    if (captionText) return captionText;
    if (title) return title;
    if (streetAddress && city && state) return `${streetAddress}, ${city}, ${state}`;
    return '';
  };

  // Fallback/placeholder image
  const fallbackImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbGUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Im0yODIuOSAxNzkuMSAzNi44IDM2LjggMS4xIDEuMS0zNi44IDM2LjgtMS4xLTEuMXptLTEuMS0xLjEtMzYuOC0zNi44LTEuMSAxLjEgMzYuOCAzNi44IDEuMS0xLjF6IiBmaWxsPSIjZDBkN2RlIi8+CjxwYXRoIGQ9Im0yNjMuNSAxOTguNSAzNi44IDM2LjggMS4xLTEuMS0zNi44LTM2LjgtMS4xIDEuMXptMS4xIDEuMS0zNi44IDM2LjgtMS4xLTEuMSAzNi44LTM2LjggMS4xIDEuMXoiIGZpbGw9IiNkMGQ3ZGUiLz4KPHRleHQgeD0iMzAwIiB5PSIyMTAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjk3NTg2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qcm9wZXJ0eSBJbWFnZTwvdGV4dD4KPHN2Zz4=';

  const currentImageUrl = getCurrentImageUrl();
  const imageToShow = currentImageUrl || fallbackImageUrl;
  const imageAlt = alt || getCaption() || 'Property Image';

  // Editor mode dropdown
  if (isEditorMode && availableImages.length > 0) {
    return (
      <Section
        style={{
          backgroundColor,
          padding,
          margin,
          border: '2px dashed #e5e7eb',
          borderRadius: '8px',
        }}
      >
        {/* Image Selection Dropdown */}
        <div style={{ marginBottom: '16px', padding: '16px' }}>
          <label 
            htmlFor="image-select"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            Select Property Image ({availableImages.length} available):
          </label>
          <select
            id="image-select"
            value={currentImageIndex}
            onChange={(e) => handleImageSelect(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
            }}
          >
            {availableImages.map((imagePath, index) => (
              <option key={index} value={index}>
                Image {index + 1} - {imagePath.split('/').pop()}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        <div style={{ textAlign: 'center' }}>
          <Img
            src={imageToShow}
            alt={imageAlt}
            width={width}
            height={height}
            style={{
              borderRadius,
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
            }}
          />
          {showCaption && getCaption() && (
            <Text
              style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '12px 0 0 0',
                textAlign: 'center',
              }}
            >
              {getCaption()}
            </Text>
          )}
        </div>
      </Section>
    );
  }

  // Email render mode
  const imageElement = (
    <Img
      src={imageToShow}
      alt={imageAlt}
      width={width}
      height={height}
      style={{
        borderRadius,
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        margin: '0 auto',
        // Email-safe styles
        border: '0',
        outline: 'none',
        textDecoration: 'none',
        msInterpolationMode: 'bicubic',
      }}
    />
  );

  return (
    <Section
      style={{
        backgroundColor,
        padding,
        margin,
        textAlign: 'center',
        // Ensure compatibility with email clients
        width: '100%',
        tableLayout: 'fixed',
      }}
    >
      {/* Responsive container for email clients */}
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {linkToProperty && propertyUrl !== '#' ? (
          <Link
            href={propertyUrl}
            style={{
              textDecoration: 'none',
              border: 'none',
              outline: 'none',
            }}
          >
            {imageElement}
          </Link>
        ) : (
          imageElement
        )}

        {showCaption && getCaption() && (
          <Text
            style={{
              fontSize: '14px',
              lineHeight: '20px',
              color: '#6b7280',
              margin: '12px 0 0 0',
              padding: '0',
              textAlign: 'center',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            {getCaption()}
          </Text>
        )}
      </div>

      {/* Mobile-specific styles */}
      <style>
        {`
          @media only screen and (max-width: 600px) {
            .property-image-container {
              width: 100% !important;
              max-width: 100% !important;
            }
            .property-image-container img {
              width: 100% !important;
              height: auto !important;
            }
          }
        `}
      </style>
    </Section>
  );
}

export default PropertyImage;