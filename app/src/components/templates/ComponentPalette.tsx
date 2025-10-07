// app/src/components/templates/ComponentPalette.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Square, Minus, Lock } from 'lucide-react';
import { getAllComponents, getComponentsByCategory } from '@landivo/email-template';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ComponentPaletteProps {
  onDragStart: (componentType: string) => void;
  templateType?: 'single' | 'multi';
}

export function ComponentPalette({ onDragStart, templateType }: ComponentPaletteProps) {
  const [activeTab, setActiveTab] = useState('content');

  const allComponents = getAllComponents();
  const contentComponents = getComponentsByCategory('content');
  const layoutComponents = getComponentsByCategory('layout');

  // Filter components based on template type
  const isComponentCompatible = (componentType: string): boolean => {
    if (!templateType) return true;
    
    const component = allComponents.find(c => c.type === componentType);
    if (!component) return false;
    
    // 'any' type components work with both template types
    if (component.type === 'any') return true;
    
    // Match component type with template type
    return component.type === templateType;
  };

  const getTooltipText = (component: any): string => {
    if (!component.available) {
      return 'Coming soon';
    }
    
    if (!templateType) {
      return component.description;
    }
    
    if (!isComponentCompatible(component.type)) {
      const oppositeType = templateType === 'single' ? 'multi' : 'single';
      return `This component is only available for ${oppositeType} property templates`;
    }
    
    return component.description;
  };

  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    if (!isComponentCompatible(componentType)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('componentType', componentType);
    onDragStart(componentType);
  };

  const handleDragEnd = () => {
    onDragStart('');
  };

  const renderComponentGrid = (components: any[]) => (
    <div className="grid grid-cols-2 gap-2">
      {components.map((component) => {
        const isCompatible = isComponentCompatible(component.type);
        const isDisabled = !component.available || !isCompatible;
        
        return (
          <TooltipProvider key={component.type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-16 flex flex-col items-center justify-center gap-0 text-xs relative ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                      : 'hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  draggable={!isDisabled}
                  onDragStart={(e) => !isDisabled && handleDragStart(e, component.type)}
                  onDragEnd={handleDragEnd}
                  disabled={isDisabled}
                >
                  {component.icon}
                  <span className="text-sm font-light tracking-tight">{component.displayName}</span>
                  <span>{component.version}</span>
                  
                  {!component.available && (
                    <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center">
                      <span className="text-xs text-gray-500 font-medium">Soon</span>
                    </div>
                  )}
                  
                  {component.available && !isCompatible && (
                    <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{getTooltipText(component)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );

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
            {templateType && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>{templateType === 'single' ? 'Single' : 'Multi'} Property Template</strong>
                  <br />
                  <span className="text-blue-700">
                    {templateType === 'single' 
                      ? 'Components designed for single property emails are available.'
                      : 'Components designed for multi-property emails are available.'
                    }
                  </span>
                </p>
              </div>
            )}
            {renderComponentGrid(allComponents)}
          </TabsContent>

          <TabsContent value="blocks" className="p-4 mt-0">
            {layoutComponents.length > 0 ? (
              renderComponentGrid(layoutComponents)
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No layout components available yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="body" className="p-4 mt-0">
            <div className="text-center text-muted-foreground py-8">
              <p>Body components coming soon</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}