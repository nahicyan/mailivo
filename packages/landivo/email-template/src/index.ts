// packages/landivo/email-template/src/index.ts
// Export all components
export * from './components/Header';
export * from './components/PropertyImage';
export * from './components/PropertyStatus';
export * from './components/PropertyHighlights';
export * from './components/PropertyDetails';

// Export registry and utilities
export * from './lib/component-registry';
export * from './types/component-metadata';

// Export convenient collections
export { componentRegistry as default } from './lib/component-registry';