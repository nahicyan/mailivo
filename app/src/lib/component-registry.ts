// app/src/lib/component-registry.ts
import { ComponentRegistry } from '@/types/component-metadata';

// Import all email components and their metadata
import { headerMetadata } from '@/emails/components/Header';

// Component registry - automatically includes all imported components
export const componentRegistry: ComponentRegistry = {
  [headerMetadata.type]: headerMetadata,
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