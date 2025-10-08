// app/src/config/propertyFieldOptions.ts
// Configuration for all property fields with fixed dropdown options

export const PROPERTY_FIELD_OPTIONS = {
  // System Information
  area: ["DFW", "Austin", "Houston", "San Antonio", "Other Areas"],
  status: ["Available", "Pending", "Sold", "Not Available", "Testing"],
  featured: ["Featured", "Not Featured"],

  // Classification
  landtype: [
    "Infill Lot",
    "Buildable Lot",
    "Mobile Home Friendly Lot",
    "Acreage Lot",
    "Raw Land",
    "Rural Lot",
    "Waterfront Lot",
    "Timberland",
    "Recreational Lot",
    "Industrial Lot",
    "Mixed-Use Lot",
    "Undeveloped Lot",
    "Investment Lot",
  ],
  zoning: ["Residential", "Commercial", "Industrial", "Agricultural", "Mixed-Use", "Special Purpose"],
  mobilehomefriendly: ["Yes", "No", "Unknown"],

  // Pricing
  hoapoa: ["Yes", "No"],
  hoapaymentterms: ["Annually", "Semi-Annually", "Quarterly", "Monthly"],

  // Financing
  financing: ["Available", "Not-Available"],
  financingtwo: ["Available", "Not-Available"],
  financingthree: ["Available", "Not-Available"],

  // Utilities
  water: ["Available", "Unavailable", "Well Needed", "Unknown", "Active Well"],
  sewer: ["Available", "Unavailable", "Septic Needed", "Unknown", "Active Septic"],
  electric: ["Available", "Unavailable", "Unknown", "On Property"],
  roadcondition: ["Paved Road", "Dirt Road", "No Access", "Gravel"],
  floodplain: [
    "Yes",
    "No",
    "100-Year Floodplain",
    "100-Year Floodway",
    "Coastal-100 Year Floodplain",
    "Coastal 100 Year Floodway",
    "100-Year Partial Floodplain",
    "500 Year-Floodplain",
    "Wetlands",
  ],
} as const;

// Helper function to check if a field has predefined options
export function hasFieldOptions(field: string): boolean {
  return field.toLowerCase() in PROPERTY_FIELD_OPTIONS;
}

// Helper function to get options for a field
export function getFieldOptions(field: string): readonly string[] | undefined {
  const normalizedField = field.toLowerCase();
  return PROPERTY_FIELD_OPTIONS[normalizedField as keyof typeof PROPERTY_FIELD_OPTIONS];
}

// Type for fields that have options
export type FieldWithOptions = keyof typeof PROPERTY_FIELD_OPTIONS;
