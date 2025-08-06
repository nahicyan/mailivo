// packages/landivo/email-template/src/index.ts
// Export all components
export * from './components/Gap';
export * from './components/Header';
export * from './components/PropertyImage';
export * from './components/PropertyStatus';
export * from './components/PropertyHighlights';
export * from './components/PropertyDetails';
export * from './components/PaymentCalculator';
export * from './components/BuyerGuidelines';
export * from './components/PropertyButtons';
export * from './components/JoinVipList';
export * from './components/Disclaimer'

// Export registry and utilities
export * from './lib/component-registry';
export * from './types/component-metadata';

// Export convenient collections
export { componentRegistry as default } from './lib/component-registry';