// app/src/components/templates/StaticImageBuilder.tsx
'use client';

import React, { useState } from 'react';
import { Link2, Upload, X } from 'lucide-react';
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

      {insertMethod === 'link' && (
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

      {insertMethod === 'upload' && (
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
          <div className="border rounded-lg p-4">
            <img
              src={imageUrl}
              alt={altText}
              className="max-w-full mx-auto"
              style={{ maxHeight: '200px' }}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onUpdate({ imageUrl: undefined });
              setInsertMethod(null);
            }}
            className="text-destructive"
          >
            <X className="w-4 h-4 mr-2" />
            Remove image
          </Button>
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