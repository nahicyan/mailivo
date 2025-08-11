// app/src/types/subject-template.ts
export interface SubjectLineTemplate {
  id: string;
  name: string;
  content: string; // Rich text HTML content
  isEnabled: boolean;
  variables: string[]; // Array of variables used in template like ['zoning', 'askingPrice']
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectTemplateRequest {
  name: string;
  content: string;
  isEnabled?: boolean;
  variables?: string[];
}

export interface UpdateSubjectTemplateRequest {
  name?: string;
  content?: string;
  isEnabled?: boolean;
  variables?: string[];
}

// Property variables available for templates
export const PROPERTY_VARIABLES = [
  { key: 'zoning', label: 'Zoning', example: 'Residential' },
  { key: 'restrictions', label: 'Restrictions', example: 'No Known Restrictions' },
  { key: 'direction', label: 'Direction', example: 'North' },
  { key: 'askingPrice', label: 'Asking Price', example: '$75,000' },
  { key: 'minPrice', label: 'Min Price', example: '$50,000' },
  { key: 'disPrice', label: 'Discounted Price', example: '$60,000' },
  { key: 'hoaPoa', label: 'HOA/POA', example: 'No' },
  { key: 'hoaFee', label: 'HOA Fee', example: '$150' },
  { key: 'hoaPaymentTerms', label: 'HOA Payment Terms', example: 'Monthly' },
  { key: 'tax', label: 'Tax', example: '$120' },
  { key: 'term', label: 'Term', example: '60' },
  { key: 'water', label: 'Water', example: 'Available' },
  { key: 'sewer', label: 'Sewer', example: 'Available' },
  { key: 'electric', label: 'Electric', example: 'Available' },
  { key: 'roadCondition', label: 'Road Condition', example: 'Paved Road' },
  { key: 'floodplain', label: 'Floodplain', example: 'No' },
  { key: 'hasCma', label: 'Has CMA', example: 'true' },
  { key: 'streetAddress', label: 'Street Address', example: '1744 West Belt Line Road' },
  { key: 'city', label: 'City', example: 'Cedar Hill' },
  { key: 'county', label: 'County', example: 'Dallas County' },
  { key: 'state', label: 'State', example: 'Texas' },
  { key: 'zip', label: 'ZIP Code', example: '75105' },
  { key: 'sqft', label: 'Square Feet', example: '21,154' },
  { key: 'acre', label: 'Acres', example: '0.49' }
] as const;

export type PropertyVariableKey = typeof PROPERTY_VARIABLES[number]['key'];