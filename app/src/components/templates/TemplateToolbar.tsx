// app/src/components/templates/TemplateToolbar.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Smartphone, 
  Monitor,
  Settings,
  Home
} from 'lucide-react';
import { EmailTemplate } from '@/types/template';

interface Property {
  id: string;
  title: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  askingPrice: number;
  sqft: number;
  acre: number;
  status: string;
  imageUrls: string[];
}

interface TemplateToolbarProps {
  template: EmailTemplate;
  onSave: () => void;
  onCancel: () => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onOpenSettings: () => void;
  selectedProperty?: Property | null;
  saving?: boolean;
}

export function TemplateToolbar({
  template,
  onSave,
  onCancel,
  onNameChange,
  onDescriptionChange,
  onOpenSettings,
  selectedProperty,
  saving = false
}: TemplateToolbarProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Back button and template name */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex flex-col">
            <Input
              value={template.name}
              onChange={(e) => onNameChange(e.target.value)}
              className="text-lg font-semibold border-none p-0 h-auto focus:ring-0 focus:border-none"
              placeholder="Template name"
            />
            <Input
              value={template.description || ''}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="text-sm text-gray-600 border-none p-0 h-auto focus:ring-0 focus:border-none mt-1"
              placeholder="Add description..."
            />
          </div>
        </div>

        {/* Center - View mode toggles */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'desktop' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('desktop')}
            className="h-8"
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'mobile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('mobile')}
            className="h-8"
          >
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenSettings}
            className="relative"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
            {selectedProperty && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </Button>

          <Button 
            onClick={onSave}
            disabled={saving || !template.name.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* Selected Property Info */}
      {selectedProperty && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Home className="w-4 h-4 text-green-600" />
          <span className="text-gray-600">Property:</span>
          <Badge variant="outline" className="text-green-700 border-green-200">
            {stripHtml(selectedProperty.title)}
          </Badge>
          <span className="text-gray-500">
            {selectedProperty.streetAddress}, {selectedProperty.city}
          </span>
          <Badge variant="secondary" className="text-xs">
            {selectedProperty.imageUrls?.length || 0} images
          </Badge>
        </div>
      )}
    </div>
  );
}