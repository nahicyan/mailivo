// app/src/app/dashboard/landivo/campaigns/create/components/Step5Picture.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Camera, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { useMemo, useEffect } from 'react';

interface Props {
    formData: any;
    setFormData: (fn: (prev: any) => any) => void;
    errors: Record<string, string>;
    selectedTemplate: any;
    selectedProperty: any;
}

export function Step5Picture({ formData, setFormData, errors, selectedTemplate, selectedProperty }: Props) {
    // Get property-image components from the selected template, sorted by order
    const propertyImageComponents = useMemo(() => {
        if (!selectedTemplate?.components) return [];
        return selectedTemplate.components
            .filter((component: any) => component.type === 'property-image')
            .sort((a: any, b: any) => a.order - b.order);
    }, [selectedTemplate]);

    // Parse property images
    const availableImages = useMemo(() => {
        if (!selectedProperty?.imageUrls) return [];
        try {
            return Array.isArray(selectedProperty.imageUrls)
                ? selectedProperty.imageUrls
                : JSON.parse(selectedProperty.imageUrls);
        } catch {
            return [];
        }
    }, [selectedProperty?.imageUrls]);

    // Only show components up to the number of available images
    const renderableComponents = useMemo(() => {
        const maxComponents = Math.min(propertyImageComponents.length, availableImages.length);
        return propertyImageComponents.slice(0, maxComponents);
    }, [propertyImageComponents, availableImages.length]);

    // Initialize default selections for all renderable components
    useEffect(() => {
        if (renderableComponents.length > 0 && availableImages.length > 0) {
            const currentSelections = formData.imageSelections || {};
            let needsUpdate = false;
            const newSelections = { ...currentSelections };

            renderableComponents.forEach((component: any) => {
                if (!currentSelections[component.id]) {
                    needsUpdate = true;
                    newSelections[component.id] = {
                        name: component.name,
                        imageIndex: component.props?.imageIndex ?? 0,
                        order: component.order
                    };
                }
            });

            if (needsUpdate) {
                setFormData(prev => ({
                    ...prev,
                    imageSelections: newSelections
                }));
            }
        }
    }, [renderableComponents, availableImages.length, formData.imageSelections, setFormData]);

    // Get current image selections
    const imageSelections = formData.imageSelections || {};

    // Handle image selection for a component
    const handleImageSelection = (componentId: string, imageIndex: number) => {
        const component = propertyImageComponents.find(c => c.id === componentId);
        setFormData(prev => ({
            ...prev,
            imageSelections: {
                ...prev.imageSelections,
                [componentId]: {
                    name: component?.name || 'Property Image',
                    imageIndex: imageIndex,
                    order: component?.order || 0
                }
            }
        }));
    };

    // Check if property has insufficient images
    const hasInsufficientImages = availableImages.length < propertyImageComponents.length;

    // If no property-image components, show info message
    if (propertyImageComponents.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Camera className="h-5 w-5" />
                        <span>Property Images</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Property Images in Template
                        </h3>
                        <p className="text-gray-500">
                            The selected template doesn't contain any property image components.
                            You can skip this step and proceed to audience selection.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // If property has no images at all
    if (availableImages.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Camera className="h-5 w-5" />
                        <span>Property Images</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-red-900 mb-2">
                            No Images Available
                        </h3>
                        <p className="text-red-600">
                            This property has no images available. Please select a different property or add images to this property.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Camera className="h-5 w-5" />
                        <span>Select Property Images</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                        Choose which property images to use for each image component in your template.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Property Info */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Property Details</h4>
                        <div className="space-y-1">
                            <p
                                className="font-medium"
                                dangerouslySetInnerHTML={{ __html: selectedProperty?.title }}
                            />
                            <p className="text-sm text-gray-600">
                                {selectedProperty?.streetAddress}, {selectedProperty?.city}, {selectedProperty?.state}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="secondary">
                                    {availableImages.length} images available
                                </Badge>
                                <Badge variant="outline">
                                    {propertyImageComponents.length} image components in template
                                </Badge>
                                <Badge variant={hasInsufficientImages ? "destructive" : "default"}>
                                    {renderableComponents.length} components will be shown
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Warning if insufficient images */}
                    {hasInsufficientImages && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-red-800">
                                        Insufficient Images
                                    </h4>
                                    <p className="text-sm text-red-700 mt-1">
                                        This property has {availableImages.length} images, but your template has {propertyImageComponents.length} image components.
                                        Only the first {availableImages.length} components will be displayed.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Debug Info */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                        <p><strong>Debug Info:</strong></p>
                        <p>Template components: {propertyImageComponents.length}</p>
                        <p>Available images: {availableImages.length}</p>
                        <p>Renderable components: {renderableComponents.length}</p>
                        <p>Current selections: {Object.keys(imageSelections).length}</p>
                    </div>

                    {/* Image Selection for Each Renderable Component */}
                    {renderableComponents.map((component: any, index: number) => {
                        const selectedImageIndex = imageSelections[component.id]?.imageIndex ?? component.props?.imageIndex ?? 0;

                        return (
                            <Card key={component.id} className="border border-gray-200">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center justify-between">
                                        <span className="flex items-center space-x-2">
                                            <ImageIcon className="h-4 w-4" />
                                            <span>{component.name}</span>
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant="outline" className="text-xs">
                                                Order: {component.order}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                Component #{index + 1}
                                            </Badge>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Component Info */}
                                    <div className="text-xs text-gray-500 space-y-1 p-2 bg-gray-50 rounded">
                                        <p><strong>Name:</strong> {component.name}</p>
                                        <p><strong>Component ID:</strong> {component.id}</p>
                                        <p><strong>Default Index:</strong> {component.props?.imageIndex ?? 0}</p>
                                        <p><strong>Order:</strong> {component.order}</p>
                                        <p><strong>Current Selection:</strong> {imageSelections[component.id] ? `Image ${imageSelections[component.id].imageIndex + 1}` : 'Not set'}</p>
                                    </div>

                                    {/* Image Selection Dropdown */}
                                    <div className="space-y-2">
                                        <Label>Select Property Image</Label>
                                        <Select
                                            value={selectedImageIndex.toString()}
                                            onValueChange={(value) => handleImageSelection(component.id, parseInt(value))}
                                        >
                                            <SelectTrigger className={errors[`imageSelection_${component.id}`] ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Choose an image..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableImages.map((imagePath: string, imageIndex: number) => (
                                                    <SelectItem key={imageIndex} value={imageIndex.toString()}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                Image {imageIndex + 1}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {imagePath.split('/').pop()}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Image Preview */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Preview</Label>
                                        <div className="border rounded-lg overflow-hidden">
                                            <img
                                                src={`https://api.landivo.com/${availableImages[selectedImageIndex]}`}
                                                alt={`${component.name} - Image ${selectedImageIndex + 1}`}
                                                className="w-full h-48 object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY5NzU4NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4K';
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 text-center">
                                            Selected: Image {selectedImageIndex + 1} for {component.name}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {/* Summary showing all selections */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Current Selections</h4>
                        <div className="space-y-1 text-sm text-green-700">
                            {Object.entries(imageSelections).map(([componentId, selection]: [string, any]) => (
                                <p key={componentId}>
                                    • {selection.name} (Order: {selection.order}) → Image {selection.imageIndex + 1}
                                </p>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}