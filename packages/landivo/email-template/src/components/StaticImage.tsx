// packages/landivo/email-template/src/components/StaticImage.tsx
import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Link2, X, Check } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';  
import { Image, Section, Text } from '@react-email/components';

// Types
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
}

interface GalleryImage {
  _id: string;
  url: string;
  filename: string;
  uploadedAt: string;
  templateId?: string;
}

// Client-side component for builder
export function StaticImageBuilder(props: StaticImageProps & { 
  onUpdate?: (updates: Partial<StaticImageProps>) => void 
}) {
  const [insertMethod, setInsertMethod] = useState<'link' | 'upload' | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState(props.imageUrl || '');
  const [tempLinkUrl, setTempLinkUrl] = useState(props.linkUrl || '');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedGradient, setSelectedGradient] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  ];

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      const response = await fetch('/api/template-images');
      if (response.ok) {
        const data = await response.json();
        setGalleryImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to fetch gallery images:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setTempImageUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', uploadedFile);
    
    if (props.onUpdate) {
      // If templateId is available, add it
      formData.append('templateId', 'current-template');
    }

    try {
      const response = await fetch('/api/template-images/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        props.onUpdate?.({ imageUrl: data.imageUrl });
        setShowUploadDialog(false);
        fetchGalleryImages(); // Refresh gallery
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const selectFromGallery = (image: GalleryImage) => {
    props.onUpdate?.({ imageUrl: image.url });
    setTempImageUrl(image.url);
    setShowUploadDialog(false);
  };

  const selectGradient = (gradient: string) => {
    props.onUpdate?.({ 
      backgroundColor: gradient,
      imageUrl: undefined 
    });
    setShowUploadDialog(false);
  };

  const getAlignmentStyle = () => {
    switch (props.alignment) {
      case 'left': return { marginRight: 'auto' };
      case 'right': return { marginLeft: 'auto' };
      default: return { margin: '0 auto' };
    }
  };

  return (
    <>
      <div className="static-image-builder space-y-4 p-4 border rounded-lg">
        {/* Insertion Method Selection */}
        {!props.imageUrl && !props.backgroundColor && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Choose insertion method:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setInsertMethod('link')}
                className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-all ${
                  insertMethod === 'link' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'hover:border-gray-400'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span className="text-sm">Image Link</span>
              </button>
              <button
                onClick={() => setInsertMethod('upload')}
                className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-all ${
                  insertMethod === 'upload' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'hover:border-gray-400'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">Upload Image</span>
              </button>
            </div>
          </div>
        )}

        {/* Image Link Input */}
        {insertMethod === 'link' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Image URL</label>
              <input
                type="url"
                value={tempImageUrl}
                onChange={(e) => setTempImageUrl(e.target.value)}
                onBlur={() => props.onUpdate?.({ imageUrl: tempImageUrl })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Link URL (optional)</label>
              <input
                type="url"
                value={tempLinkUrl}
                onChange={(e) => setTempLinkUrl(e.target.value)}
                onBlur={() => props.onUpdate?.({ linkUrl: tempLinkUrl })}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Upload Button */}
        {insertMethod === 'upload' && (
          <button
            onClick={() => setShowUploadDialog(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
          >
            <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <span className="text-sm text-gray-600">Click to upload image</span>
          </button>
        )}

        {/* Preview */}
        {(props.imageUrl || props.backgroundColor) && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Preview:</label>
            <div 
              className="border rounded-lg p-4"
              style={{ backgroundColor: props.backgroundColor || '#f3f4f6' }}
            >
              {props.imageUrl && (
                <img
                  src={props.imageUrl}
                  alt={props.altText}
                  style={{
                    width: `${props.width}px`,
                    height: props.height ? `${props.height}px` : 'auto',
                    borderRadius: `${props.borderRadius}px`,
                    ...getAlignmentStyle()
                  }}
                  className="max-w-full"
                />
              )}
              {props.showCaption && props.caption && (
                <p className="text-center text-sm text-gray-600 mt-2 italic">
                  {props.caption}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                props.onUpdate?.({ imageUrl: undefined, backgroundColor: undefined });
                setInsertMethod(null);
                setTempImageUrl('');
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove image
            </button>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Upload your profile image</h2>
              <button
                onClick={() => setShowUploadDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">Choose an image that will appear everywhere in our app.</p>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">Click or drag and drop to upload your file</p>
              <p className="text-sm text-gray-500">PNG, JPG, PDF, GIF, SVG (Max 5 MB)</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
              >
                Choose File
              </label>
            </div>

            {/* Gallery Section */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Choose from your gallery:</h3>
              <div className="grid grid-cols-4 gap-3">
                {/* Gradient Options */}
                {gradients.map((gradient, index) => (
                  <button
                    key={`gradient-${index}`}
                    onClick={() => selectGradient(gradient)}
                    className={`aspect-square rounded-lg relative transition-all ${
                      selectedGradient === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{ background: gradient }}
                  >
                    {selectedGradient === index && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </button>
                ))}
                
                {/* Gallery Images */}
                {galleryImages.map((image) => (
                  <button
                    key={image._id}
                    onClick={() => selectFromGallery(image)}
                    className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400"
                  >
                    <img 
                      src={image.url} 
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUploadDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadedFile || isUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Save image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Email render component
export default function StaticImage(props: StaticImageProps) {
  const {
    imageUrl,
    altText = 'Image',
    width = 600,
    height,
    alignment = 'center',
    linkUrl,
    borderRadius = 0,
    backgroundColor,
    caption,
    showCaption
  } = props;

  const imageStyle: React.CSSProperties = {
    maxWidth: '100%',
    width: `${width}px`,
    height: height ? `${height}px` : 'auto',
    borderRadius: `${borderRadius}px`,
    display: 'block',
    margin: alignment === 'center' ? '0 auto' : alignment === 'right' ? '0 0 0 auto' : '0 auto 0 0'
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: backgroundColor || 'transparent',
    padding: '20px',
    textAlign: alignment
  };

  const content = (
    <>
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={altText}
          style={imageStyle}
        />
      )}
      {showCaption && caption && (
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
      )}
    </>
  );

  return (
    <Section style={sectionStyle}>
      {linkUrl ? (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        content
      )}
    </Section>
  );
}

// Component metadata
export const staticImageMetadata: EmailComponentMetadata = {
  type: 'static-image',
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
    height: undefined,
    alignment: 'center',
    linkUrl: '',
    borderRadius: 0,
    margin: '0',
    padding: '20px',
    backgroundColor: '',
    caption: '',
    showCaption: false
  },
  configFields: [
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
      key: 'borderRadius',
      label: 'Border Radius (px)',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 50
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
      type: 'boolean',
      defaultValue: false
    },
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: ''
    }
  ],
  component: StaticImage
};