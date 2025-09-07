// app/src/components/templates/ImageUploadDialog.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSelect: (imageUrl: string) => void;
  onGradientSelect?: (gradient: string) => void;
  templateId?: string;
}

interface GalleryImage {
  _id: string;
  url: string;
  filename: string;
  uploadedAt: string;
}

export function ImageUploadDialog({
  open,
  onOpenChange,
  onImageSelect,
  onGradientSelect,
  templateId
}: ImageUploadDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const gradients = [
    { id: 'g1', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'g2', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'g3', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'g4', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'g5', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 'g6', value: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
    { id: 'g7', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'g8', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  ];

  useEffect(() => {
    if (open) {
      fetchGalleryImages();
    }
  }, [open]);

  const fetchGalleryImages = async () => {
    try {
      const params = new URLSearchParams();
      if (templateId) params.append('templateId', templateId);
      
      const response = await fetch(`/api/template-images?${params}`);
      if (response.ok) {
        const data = await response.json();
        setGalleryImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewUrl(e.target.result as string);
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
    if (templateId) formData.append('templateId', templateId);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mailivo.landivo.com';
      const response = await fetch(`${API_URL}/template-images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        onImageSelect(data.imageUrl);
        onOpenChange(false);
      } else {
        const error = await response.text();
        console.error('Upload failed:', error);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGallerySelect = (image: GalleryImage) => {
    setSelectedItem(image._id);
    onImageSelect(image.url);
    onOpenChange(false);
  };

  const handleGradientSelect = (gradient: string) => {
    if (onGradientSelect) {
      onGradientSelect(gradient);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload your profile image</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose an image that will appear everywhere in our app.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {/* Upload Section */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-3">Upload new image:</p>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                uploadedFile && "border-green-500 bg-green-50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-32 mx-auto rounded"
                  />
                  <p className="text-sm text-muted-foreground">
                    {uploadedFile?.name}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploadedFile(null);
                      setPreviewUrl('');
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Click or drag and drop to upload your file
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    PNG, JPG, PDF, GIF, SVG (Max 5 MB)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="secondary" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Gallery Section */}
          <div>
            <p className="text-sm font-medium mb-3">Choose from your gallery:</p>
            <div className="grid grid-cols-4 gap-3">
              {/* Gradient Options */}
              {onGradientSelect && gradients.map((gradient) => (
                <button
                  key={gradient.id}
                  onClick={() => handleGradientSelect(gradient.value)}
                  className={cn(
                    "aspect-square rounded-lg relative transition-all",
                    "hover:ring-2 hover:ring-primary hover:ring-offset-2",
                    selectedItem === gradient.id && "ring-2 ring-primary ring-offset-2"
                  )}
                  style={{ background: gradient.value }}
                >
                  {selectedItem === gradient.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  )}
                </button>
              ))}
              
              {/* Gallery Images */}
              {galleryImages.map((image) => (
                <button
                  key={image._id}
                  onClick={() => handleGallerySelect(image)}
                  className={cn(
                    "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                    "hover:border-primary",
                    selectedItem === image._id ? "border-primary" : "border-muted"
                  )}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={!uploadedFile || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Save image'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

