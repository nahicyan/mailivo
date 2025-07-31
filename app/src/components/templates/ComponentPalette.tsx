// app/src/components/templates/ComponentPalette.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Type, 
  Image, 
  Columns, 
  Square,
  Menu,
  Users,
  Clock,
  Video,
  Code,
  Minus
} from 'lucide-react';

interface ComponentPaletteProps {
  onDragStart: (componentType: string) => void;
}

interface ComponentDefinition {
  type: string;
  name: string;
  icon: React.ReactNode;
  available: boolean;
  description: string;
}

const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  {
    type: 'header',
    name: 'HEADING',
    icon: <Type className="w-5 h-5" />,
    available: true,
    description: 'Add header with Landivo branding'
  },
  {
    type: 'columns',
    name: 'COLUMNS',
    icon: <Columns className="w-5 h-5" />,
    available: false,
    description: 'Create multi-column layouts'
  },
  {
    type: 'button',
    name: 'BUTTON',
    icon: <Square className="w-5 h-5" />,
    available: false,
    description: 'Add call-to-action buttons'
  },
  {
    type: 'divider',
    name: 'DIVIDER',
    icon: <Minus className="w-5 h-5" />,
    available: false,
    description: 'Add visual separators'
  },
  {
    type: 'image',
    name: 'IMAGE',
    icon: <Image className="w-5 h-5" />,
    available: false,
    description: 'Insert property images'
  },
  {
    type: 'html',
    name: 'HTML',
    icon: <Code className="w-5 h-5" />,
    available: false,
    description: 'Add custom HTML content'
  },
  {
    type: 'menu',
    name: 'MENU',
    icon: <Menu className="w-5 h-5" />,
    available: false,
    description: 'Add navigation menus'
  },
  {
    type: 'social',
    name: 'SOCIAL',
    icon: <Users className="w-5 h-5" />,
    available: false,
    description: 'Add social media links'
  },
  {
    type: 'text',
    name: 'TEXT',
    icon: <Type className="w-5 h-5" />,
    available: false,
    description: 'Add text blocks'
  },
  {
    type: 'timer',
    name: 'TIMER',
    icon: <Clock className="w-5 h-5" />,
    available: false,
    description: 'Add countdown timers'
  },
  {
    type: 'video',
    name: 'VIDEO',
    icon: <Video className="w-5 h-5" />,
    available: false,
    description: 'Embed video content'
  }
];

export function ComponentPalette({ onDragStart }: ComponentPaletteProps) {
  const [activeTab, setActiveTab] = useState('content');

  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    e.dataTransfer.setData('componentType', componentType);
    onDragStart(componentType);
  };

  const handleDragEnd = () => {
    onDragStart('');
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
            <TabsTrigger value="blocks" className="text-xs">Blocks</TabsTrigger>
            <TabsTrigger value="body" className="text-xs">Body</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="content" className="p-4 space-y-2 mt-0">
            <div className="grid grid-cols-2 gap-2">
              {COMPONENT_DEFINITIONS.map((component) => (
                <Button
                  key={component.type}
                  variant="outline"
                  className={`h-16 flex flex-col items-center justify-center gap-1 text-xs relative ${
                    !component.available 
                      ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                      : 'hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  draggable={component.available}
                  onDragStart={(e) => component.available && handleDragStart(e, component.type)}
                  onDragEnd={handleDragEnd}
                  disabled={!component.available}
                  title={component.description}
                >
                  {component.icon}
                  <span className="font-medium">{component.name}</span>
                  {!component.available && (
                    <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center">
                      <span className="text-xs text-gray-500 font-medium">Soon</span>
                    </div>
                  )}
                </Button>
              ))}
            </div>

            {/* Available Components Info */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Available Components</h4>
              <div className="space-y-2">
                {COMPONENT_DEFINITIONS.filter(c => c.available).map((component) => (
                  <div key={component.type} className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center">
                      {component.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-900">{component.name}</div>
                      <div className="text-xs text-blue-700">{component.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="blocks" className="p-4 mt-0">
            <div className="text-center text-gray-500 py-8">
              <Square className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Block components coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="body" className="p-4 mt-0">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded border bg-white"></div>
                  <span className="text-sm text-gray-600">#ffffff</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded border bg-green-600"></div>
                  <span className="text-sm text-gray-600">#059669</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}