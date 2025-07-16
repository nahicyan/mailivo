// app/src/data/componentDefinitions.ts
import { ComponentDefinition } from '@/types/template';

export const componentDefinitions: ComponentDefinition[] = [
  {
    type: 'header',
    name: 'Header',
    icon: '📝',
    description: 'Title, subtitle and featured image',
    defaultProps: {
      title: 'Your Property Title',
      subtitle: 'Location details',
      imageUrl: '',
      backgroundColor: '#ffffff'
    },
    configFields: [
      { key: 'title', label: 'Title', type: 'textarea', required: true },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'imageUrl', label: 'Image URL', type: 'text' },
      { key: 'backgroundColor', label: 'Background Color', type: 'color' }
    ]
  },
  {
    type: 'property-highlights',
    name: 'Property Highlights',
    icon: '⭐',
    description: '4-column grid showcasing key features',
    defaultProps: {
      highlights: [
        { icon: '📏', value: '21,154', label: 'sqft' },
        { icon: '🏠', value: 'Residential', label: 'Zoning' },
        { icon: 'ℹ️', value: 'Not Available', label: 'Survey' },
        { icon: '🕒', value: 'Available', label: 'Financing' }
      ],
      backgroundColor: '#ffffff'
    },
    configFields: [
      { key: 'highlights', label: 'Highlights', type: 'array' },
      { key: 'backgroundColor', label: 'Background Color', type: 'color' }
    ]
  },
  {
    type: 'property-details',
    name: 'Property Details',
    icon: '🏘️',
    description: 'Two-column layout for location and property info',
    defaultProps: {
      locationDetails: [
        { label: 'County', value: 'Example County' },
        { label: 'State', value: 'TX' },
        { label: 'Zip', value: '12345' }
      ],
      propertyDetails: [
        { label: 'Size', value: '21,154 sqft' },
        { label: 'Acreage', value: '0.5' },
        { label: 'Zoning', value: 'Residential' }
      ],
      backgroundColor: '#ffffff'
    },
    configFields: [
      { key: 'locationDetails', label: 'Location Details', type: 'array' },
      { key: 'propertyDetails', label: 'Property Details', type: 'array' },
      { key: 'backgroundColor', label: 'Background Color', type: 'color' }
    ]
  },
  {
    type: 'payment-calculator',
    name: 'Payment Calculator',
    icon: '💰',
    description: 'Financial details with circular payment display',
    defaultProps: {
      plan: {
        monthly: 299,
        loan: 45000,
        down: 5000,
        interest: 9.5
      },
      propertyTax: 1200,
      serviceFee: 35,
      backgroundColor: '#ffffff',
      buttonColor: '#16a34a',
      multipleePlans: false
    },
    configFields: [
      { key: 'plan.monthly', label: 'Monthly Payment', type: 'number', required: true },
      { key: 'plan.loan', label: 'Loan Amount', type: 'number', required: true },
      { key: 'plan.down', label: 'Down Payment', type: 'number', required: true },
      { key: 'plan.interest', label: 'Interest Rate', type: 'number', required: true },
      { key: 'propertyTax', label: 'Annual Property Tax', type: 'number' },
      { key: 'serviceFee', label: 'Monthly Service Fee', type: 'number' },
      { key: 'backgroundColor', label: 'Background Color', type: 'color' },
      { key: 'buttonColor', label: 'Button Color', type: 'color' },
      { key: 'multipleePlans', label: 'Show Multiple Plans Link', type: 'boolean' }
    ]
  },
  {
    type: 'buyer-guidelines',
    name: 'Buyer Guidelines',
    icon: '📋',
    description: 'Expandable guidelines section',
    defaultProps: {
      title: 'Buyer Guidelines',
      guidelines: [
        'Buyer pays ALL closing costs.',
        'Cash OR Hard Money Only.',
        'A $395 transaction fee applies to each contract.',
        'This Property is being sold AS-IS.',
        'No Daisy Chaining – No Option Period.'
      ],
      backgroundColor: '#ffffff'
    },
    configFields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'guidelines', label: 'Guidelines', type: 'array' },
      { key: 'backgroundColor', label: 'Background Color', type: 'color' }
    ]
  },
  {
    type: 'footer',
    name: 'Footer',
    icon: '🔗',
    description: 'Unsubscribe links and company info',
    defaultProps: {
      unsubscribeUrl: '{{unsubscribe_url}}',
      backgroundColor: '#f9fafb',
      companyName: 'Landivo'
    },
    configFields: [
      { key: 'unsubscribeUrl', label: 'Unsubscribe URL', type: 'text', required: true },
      { key: 'backgroundColor', label: 'Background Color', type: 'color' },
      { key: 'companyName', label: 'Company Name', type: 'text' }
    ]
  },
  {
    type: 'spacer',
    name: 'Spacer',
    icon: '📏',
    description: 'Add spacing between components',
    defaultProps: {
      height: 20,
      backgroundColor: 'transparent'
    },
    configFields: [
      { key: 'height', label: 'Height (px)', type: 'number', required: true },
      { key: 'backgroundColor', label: 'Background Color', type: 'color' }
    ]
  },
  {
    type: 'text',
    name: 'Text Block',
    icon: '📄',
    description: 'Custom text content',
    defaultProps: {
      content: 'Add your custom text here...',
      textAlign: 'left',
      fontSize: '16',
      color: '#374151',
      backgroundColor: '#ffffff'
    },
    configFields: [
      { key: 'content', label: 'Content', type: 'textarea', required: true },
      { key: 'textAlign', label: 'Text Align', type: 'select', options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ]},
      { key: 'fontSize', label: 'Font Size', type: 'number' },
      { key: 'color', label: 'Text Color', type: 'color' },
      { key: 'backgroundColor', label: 'Background Color', type: 'color' }
    ]
  }
];