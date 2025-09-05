// app/src/components/templates/ImageGalleryModal.tsx
import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Search, Trash2, Download, Eye, Grid, List } from 'lucide-react';

interface UploadedImage {
  id: string;
  url: string;
  name: string;
  size: number;
  format: string;
  uploadedAt: string;
  dimensions?: { width: number; height: number };
}

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (image: UploadedImage | string) => void;
  currentImageUrl?: string;
  uploadedImages?: UploadedImage[];
  onUploadImages?: (files: FileList) => Promise<UploadedImage[]>;
  onDeleteImage?: (imageId: string) => Promise<void>;
}

export function ImageGalleryModal({
  isOpen,
  onClose,
  onSelectImage,
  currentImageUrl = '',
  uploadedImages = [],
  onUploadImages,
  onDeleteImage
}: ImageGalleryModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'gallery'>('gallery');
  const [urlInput, setUrlInput] = useState(currentImageUrl);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter images based on search
  const filteredImages = uploadedImages.filter(img =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.format.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!onUploadImages || files.length === 0) return;
    
    setUploading(true);
    try {
      const uploadedImages = await onUploadImages(files);
      if (uploadedImages.length > 0) {
        setSelectedImage(uploadedImages[0]);
        setActiveTab('gallery');
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [onUploadImages]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle image selection
  const handleSelectImage = () => {
    if (activeTab === 'url' && urlInput.trim()) {
      onSelectImage(urlInput.trim());
      onClose();
    } else if (activeTab === 'gallery' && selectedImage) {
      onSelectImage(selectedImage);
      onClose();
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteImage) return;
    
    try {
      await onDeleteImage(imageId);
      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Select Image</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'gallery'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Gallery ({uploadedImages.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload New
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'url'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Image URL
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="h-full flex flex-col">
              {/* Gallery Controls */}
              <div className="p-4 border-b flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex rounded-lg border">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Gallery Content */}
              <div className="flex-1 overflow-auto p-4">
                {filteredImages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Upload className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-gray-600 mb-2">No images found</p>
                    <p className="text-sm text-gray-400">
                      {searchQuery ? 'Try a different search term' : 'Upload some images to get started'}
                    </p>
                  </div>
                ) : (
                  <div className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                      : 'space-y-2'
                  }>
                    {filteredImages.map((image) => (
                      <div
                        key={image.id}
                        onClick={() => setSelectedImage(image)}
                        className={`
                          relative cursor-pointer rounded-lg overflow-hidden transition-all
                          ${selectedImage?.id === image.id
                            ? 'ring-2 ring-blue-500 shadow-lg'
                            : 'hover:shadow-md border border-gray-200'
                          }
                          ${viewMode === 'grid' ? 'aspect-square' : 'flex items-center p-3'}
                        `}
                      >
                        {viewMode === 'grid' ? (
                          <>
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleDeleteImage(image.id, e)}
                                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                              <p className="text-xs truncate">{image.name}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-12 h-12 object-cover rounded mr-3"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{image.name}</p>
                              <p className="text-sm text-gray-500">
                                {image.format.toUpperCase()} • {formatFileSize(image.size)}
                                {image.dimensions && ` • ${image.dimensions.width}×${image.dimensions.height}`}
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleDeleteImage(image.id, e)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="h-full flex items-center justify-center p-6">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  w-full max-w-md p-8 border-2 border-dashed rounded-lg text-center transition-colors
                  ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                `}
              >
                <div className="text-gray-400 mb-4">
                  <Upload className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium mb-2">Upload Images</h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop images here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Choose Files'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-4">
                  Supports JPG, PNG, GIF, WebP up to 10MB each
                </p>
              </div>
            </div>
          )}

          {/* URL Tab */}
          {activeTab === 'url' && (
            <div className="h-full flex items-center justify-center p-6">
              <div className="w-full max-w-md">
                <div className="text-center mb-6">
                  <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Image URL</h3>
                  <p className="text-gray-600">Enter a direct link to your image</p>
                </div>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {urlInput && (
                  <div className="mt-4 p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <img
                      src={urlInput}
                      alt="Preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      className="max-w-full h-32 object-contain rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {activeTab === 'gallery' && selectedImage && (
              <span>Selected: {selectedImage.name}</span>
            )}
            {activeTab === 'url' && urlInput && (
              <span>URL: {urlInput.substring(0, 50)}...</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectImage}
              disabled={
                (activeTab === 'gallery' && !selectedImage) ||
                (activeTab === 'url' && !urlInput.trim())
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Select Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}