// app/src/types/template.ts
export interface EmailComponent {
  id: string;
  type: 'header' | 'property-image' | 'property-highlights' | 'property-details' | 'payment-calculator' | 'buyer-guidelines' | 'footer' | 'spacer' | 'text';
  name: string;
  icon: string;
  props: Record<string, any>;
  order: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'property' | 'newsletter' | 'announcement' | 'custom';
  components: EmailComponent[];
  settings: {
    backgroundColor?: string;
    primaryColor?: string;
    fontFamily?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ComponentDefinition {
  type: string;
  name: string;
  icon: string;
  description: string;
  defaultProps: Record<string, any>;
  configFields: ComponentConfigField[];
}

export interface ComponentConfigField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'number' | 'select' | 'boolean' | 'array';
  options?: { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
}