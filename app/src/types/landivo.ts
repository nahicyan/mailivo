export interface LandivoProperty {
  id: string;
  
  // System Information
  ownerId?: number;
  area: string;
  status: string;
  featured?: string;
  
  // Listing Details
  title: string;
  description: string;
  notes?: string;
  
  // Property Classification
  type?: string;
  landType: string[]; // Array of land types
  zoning: string;
  restrictions?: string;
  survey?: string;
  legalDescription?: string;
  mobileHomeFriendly?: string;
  
  // Location & Identification
  streetAddress: string;
  toggleObscure: boolean;
  city: string;
  county: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
  apnOrPin: string;
  direction?: string;
  landId: boolean;
  landIdLink?: string;
  
  // Property Size & Dimensions
  sqft?: number;
  acre: number;
  
  // Pricing
  askingPrice: number;
  minPrice: number;
  disPrice: number;
  hoaPoa: string;
  hoaFee?: number;
  hoaPaymentTerms?: string;
  tax?: number;
  
  // Financing Options
  financing: string;
  financingTwo?: string;
  financingThree?: string;
  serviceFee?: number;
  term?: number;
  hoaMonthly?: number;
  interestOne?: number;
  interestTwo?: number;
  interestThree?: number;
  monthlyPaymentOne?: number;
  monthlyPaymentTwo?: number;
  monthlyPaymentThree?: number;
  downPaymentOne?: number;
  downPaymentTwo?: number;
  downPaymentThree?: number;
  loanAmountOne?: number;
  loanAmountTwo?: number;
  loanAmountThree?: number;
  purchasePrice?: number;
  financedPrice?: number;
  
  // Utilities and Infrastructure
  water?: string;
  sewer?: string;
  electric?: string;
  roadCondition?: string;
  floodplain?: string;
  
  // CMA fields
  hasCma: boolean;
  cmaData?: string;
  cmaFilePath?: string;
  
  // Media & Tags
  imageUrls?: any; // JSON field
  videoUrls?: any; // JSON field
  ltag?: string;
  rtag?: string;
  
  // Miscellaneous
  viewCount?: number;
  profileId?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface LandivoBuyer {
  id: string;
  
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Financial Information
  grossAnnualIncome?: string;
  totalMonthlyPayments?: number;
  currentCreditScore?: string;
  employmentStatus?: string;
  verifyIncome?: string;
  incomeHistory?: string;
  
  // Property Preferences
  homeUsage?: string;
  homePurchaseTiming?: string;
  currentHomeOwnership?: string;
  
  // Qualification Status
  qualified: boolean;
  disqualificationReason?: string;
  
  // Property Context (when applicable)
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  
  // Financial History
  currentOnAllPayments?: string;
  openCreditLines?: string;
  foreclosureForbearance?: string;
  declaredBankruptcy?: string;
  liensOrJudgments?: string;
  
  // Meta
  language?: string;
  realEstateAgent?: string;
  
  createdAt: string;
  updatedAt: string;
}