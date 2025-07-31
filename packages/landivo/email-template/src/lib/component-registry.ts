// app/src/lib/component-registry.ts
import { ComponentRegistry } from '../types/component-metadata';

// Import all email components and their metadata
import { headerMetadata } from '../components/Header';
import { propertyImageMetadata } from '../components/PropertyImage'

// Component registry - automatically includes all imported components
export const componentRegistry: ComponentRegistry = {
  [headerMetadata.type]: headerMetadata,
    [propertyImageMetadata.type]: propertyImageMetadata,
  // Future components will be added here automatically when imported
};

// Helper functions for working with the registry
export const getComponent = (type: string) => {
  return componentRegistry[type];
};

export const getAllComponents = () => {
  return Object.values(componentRegistry);
};

export const getComponentsByCategory = (category: string) => {
  return Object.values(componentRegistry).filter(comp => comp.category === category);
};

export const getAvailableComponents = () => {
  return Object.values(componentRegistry).filter(comp => comp.available);
};