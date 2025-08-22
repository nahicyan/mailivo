// packages/landivo/email-template/src/lib/component-registry.ts
import { ComponentRegistry } from '../types/component-metadata';

// Import all email components and their metadata
import { gapMetadata } from '../components/Gap';
import { headerMetadata } from '../components/Header';
import { propertyImageMetadata } from '../components/PropertyImage';
import { propertyStatusMetadata } from '../components/PropertyStatus';
import { propertyHighlightsMetadata } from '../components/PropertyHighlights';
import { propertyDetailsMetadata } from '../components/PropertyDetails'
import { paymentCalculatorMetadata } from '../components/PaymentCalculator';
import { buyerGuidelinesMetadata } from '../components/BuyerGuidelines';
import { propertyButtonsMetadata } from '../components/PropertyButtons';
import { joinVipListMetadata } from '../components/JoinVipList';
import { disclaimerMetadata } from '../components/Disclaimer'
import { propertiesRowMetadata } from '../components/PropertiesRow'

// Component registry - automatically includes all imported components
export const componentRegistry: ComponentRegistry = {
  [gapMetadata.type]: gapMetadata,
  [headerMetadata.type]: headerMetadata,
  [propertyImageMetadata.type]: propertyImageMetadata,
  [propertyStatusMetadata.type]: propertyStatusMetadata,
  [propertyHighlightsMetadata.type]: propertyHighlightsMetadata,
  [propertyDetailsMetadata.type]: propertyDetailsMetadata,
  [paymentCalculatorMetadata.type]: paymentCalculatorMetadata,
  [buyerGuidelinesMetadata.type]: buyerGuidelinesMetadata,
  [propertyButtonsMetadata.type]: propertyButtonsMetadata,
  [joinVipListMetadata.type]: joinVipListMetadata,
  [disclaimerMetadata.type]: disclaimerMetadata,
  [propertiesRowMetadata.type]: propertiesRowMetadata,
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