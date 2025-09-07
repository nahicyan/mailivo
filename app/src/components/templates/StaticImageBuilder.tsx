// app/src/components/templates/StaticImageBuilder.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Link2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploadDialog } from './ImageUploadDialog';

interface StaticImageBuilderProps {
  imageUrl?: string;
  linkUrl?: string;
  altText?: string;
  alignment?: 'left' | 'center' | 'right';
  onUpdate: (props: any) => void;
}

export function StaticImageBuilder({ 
  imageUrl, 
  linkUrl = '',
  altText = 'Image',
  alignment = 'center',
  onUpdate 
}: StaticImageBuilderProps) {
  const [insertMethod, setInsertMethod] = useState<'link' | 'upload' | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [tempLinkUrl, setTempLinkUrl] = useState(linkUrl);
  const [tempImageUrl, setTempImageUrl] = useState(imageUrl || '');

  // Auto-detect method based on existing imageUrl
  useEffect(() => {
    if (imageUrl && !insertMethod) {
      setInsertMethod(imageUrl.includes('uploads/template-images') ? 'upload' : 'link');
    }
  }, [imageUrl]);

  // Fix image URL for display
  const getDisplayImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://localhost')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';
      return url.replace(/http:\/\/localhost:\d+/, baseUrl);
    }
    return url;
  };

  return (
    <div className="space-y-4">
      {!imageUrl && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={insertMethod === 'link' ? 'default' : 'outline'}
            onClick={() => setInsertMethod('link')}
            className="justify-start"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Image Link
          </Button>
          <Button
            variant={insertMethod === 'upload' ? 'default' : 'outline'}
            onClick={() => setInsertMethod('upload')}
            className="justify-start"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
          </Button>
        </div>
      )}

      {insertMethod === 'link' && !imageUrl && (
        <div className="space-y-3">
          <div>
            <Label>Image URL</Label>
            <Input
              type="url"
              value={tempImageUrl}
              onChange={(e) => setTempImageUrl(e.target.value)}
              onBlur={() => onUpdate({ imageUrl: tempImageUrl })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <Label>Link URL (optional)</Label>
            <Input
              type="url"
              value={tempLinkUrl}
              onChange={(e) => setTempLinkUrl(e.target.value)}
              onBlur={() => onUpdate({ linkUrl: tempLinkUrl })}
              placeholder="https://example.com"
            />
          </div>
        </div>
      )}

      {insertMethod === 'upload' && !imageUrl && (
        <Button
          onClick={() => setShowDialog(true)}
          variant="outline"
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Click to upload image
        </Button>
      )}

      {imageUrl && (
        <div className="space-y-3">
          <Label>Current Image</Label>
          <div className="border rounded-lg p-3 bg-gray-50">
            <img
              src={getDisplayImageUrl(imageUrl)}
              alt={altText}
              className="w-full h-auto max-h-48 object-contain rounded"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x200/e5e7eb/6b7280?text=Image+Not+Found';
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDialog(true)}
              className="flex-1"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Change image
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onUpdate({ imageUrl: undefined });
                setInsertMethod(null);
                setTempImageUrl('');
              }}
              className="text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <ImageUploadDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onImageSelect={(url) => {
          onUpdate({ imageUrl: url });
          setShowDialog(false);
        }}
      />
    </div>
  );
}