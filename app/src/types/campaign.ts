// app/src/types/campaign.ts

export interface PaymentPlan {
  planNumber: number; // 1, 2, or 3
  planName: string; // "Payment Plan 1", etc.
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  monthlyPayment: number;
  isAvailable: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  property: string;
  emailList: string;
  emailTemplate: string;
  emailAddressGroup: string;
  emailSchedule: string;
  emailVolume: number;
  status: "draft" | "active" | "paused" | "completed";

  // Image selections
  imageSelections?: Record<
    string,
    {
      name: string;
      imageIndex: number;
      order: number;
    }
  >;

  // Payment plan selection
  selectedPlan?: {
    planNumber: number;
    planName: string;
    downPayment: number;
    loanAmount: number;
    interestRate: number;
    monthlyPayment: number;
  } | null;

metrics?: {
  open: number;
  sent: number;
  bounces: number;
  successfulDeliveries: number;
  clicks: number;
  clicked?: number;        
  totalClicks?: number;    
  didNotOpen: number;
  mobileOpen: number;
}
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  description?: string;
}

export interface CreateCampaignRequest {
  name: string;
  property: string;
  emailList: string;
  emailTemplate: string;
  emailAddressGroup: string;
  emailSchedule: string;
  subject?: string;
  emailVolume: number;
  description?: string;
  scheduledDate?: string;

  imageSelections?: Record<
    string,
    {
      name: string;
      imageIndex: number;
      order: number;
    }
  >;

  selectedPlan?: {
    planNumber: number;
    planName: string;
    downPayment: number;
    loanAmount: number;
    interestRate: number;
    monthlyPayment: number;
  } | null;
}

export interface CampaignMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  clicked?: number;
  totalClicks?: number;
  avgClicksPerLink?: number;
  clickThroughRate?: number;
  topLink?: string;
}

// Property payment data interface
export interface PropertyPaymentData {
  financing: string;
  financingTwo: string;
  financingThree: string;
  serviceFee: number;
  term: number;
  hoaMonthly?: number;
  interestOne: number;
  interestTwo: number;
  interestThree: number;
  monthlyPaymentOne: number;
  monthlyPaymentTwo: number;
  monthlyPaymentThree?: number;
  downPaymentOne: number;
  downPaymentTwo: number;
  downPaymentThree?: number;
  loanAmountOne: number;
  loanAmountTwo: number;
  loanAmountThree?: number;
  askingPrice: number;
}
