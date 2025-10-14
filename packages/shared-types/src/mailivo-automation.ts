// packages/shared-types/src/mailivo-automation.ts
// Complete Automation System for Mailivo

export type AutomationTriggerType = "property_uploaded" | "time_based" | "property_viewed" | "property_updated" | "campaign_status_changed" | "email_tracking_status" | "unsubscribe";

export type AutomationConditionCategory = "property_data" | "campaign_data" | "email_tracking" | "email_template" | "buyer_data";

export type AutomationActionType = "send_campaign";

export type ComparisonOperator = "equals" | "not_equals" | "greater_than" | "less_than" | "between" | "in" | "not_in" | "contains" | "not_contains";

export type DateOperator = "on" | "before" | "after" | "between" | "in_last" | "in_next";

// ============================================
// TRIGGER CONFIGURATIONS
// ============================================

export interface PropertyUploadedTrigger {
  type: "property_uploaded";
  config: {
    propertyIds?: string[]; // Optional: specific properties, if empty = all new uploads
    immediate?: boolean; // Fire immediately or wait for conditions
  };
}

export interface TimeBasedTrigger {
  type: "time_based";
  config: {
    schedule: "daily" | "weekly" | "monthly" | "specific_date";
    time?: string; // HH:MM format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    specificDate?: Date;
    timezone?: string;
  };
}

export interface PropertyViewedTrigger {
  type: "property_viewed";
  config: {
    propertyIds?: string[]; // Optional: specific properties
    viewCount?: number; // Trigger after X views
    timeframe?: number; // Within X days
    requireLoggedIn: boolean;
  };
}

export interface PropertyUpdatedTrigger {
  type: "property_updated";
  config: {
    propertyIds?: string[];
    updateType?: "status_change" | "any_update" | "discount" | "availability_change";
  };
}

export interface CampaignStatusChangedTrigger {
  type: "campaign_status_changed";
  config: {
    campaignIds?: string[];
    fromStatus?: string[];
    toStatus: string[]; // 'sent', 'completed', 'failed', etc
  };
}

export interface EmailTrackingStatusTrigger {
  type: "email_tracking_status";
  config: {
    campaignIds?: string[];
    event: "opened" | "clicked" | "delivered" | "bounced" | "rejected";
    linkText?: string; // For clicked events
    timeframe?: number; // Within X hours/days
  };
}

export interface UnsubscribeTrigger {
  type: "unsubscribe";
  config: {
    emailListIds?: string[];
    reason?: string[];
  };
}

export type AutomationTrigger =
  | PropertyUploadedTrigger
  | TimeBasedTrigger
  | PropertyViewedTrigger
  | PropertyUpdatedTrigger
  | CampaignStatusChangedTrigger
  | EmailTrackingStatusTrigger
  | UnsubscribeTrigger;

// ============================================
// CONDITION CONFIGURATIONS
// ============================================

export interface PropertyDataCondition {
  category: "property_data";
  conditions: Array<{
    field:
      | "area"
      | "status"
      | "featured"
      | "landtype"
      | "zoning"
      | "mobilehomefriendly"
      | "city"
      | "county"
      | "state"
      | "zip"
      | "water"
      | "sewer"
      | "electric"
      | "roadCondition"
      | "floodplain"
      | "ltag"
      | "rtag"
      | "landid"
      | "financing"
      | "financingTwo"
      | "financingThree"
      | "hoapoa"
      | "hascma"
      | "sqft"
      | "acre"
      | "askingprice"
      | "minprice"
      | "disprice"
      | "purchasePrice"
      | "financedPrice"
      | "longitude"
      | "latitude"
      | "createdAt"
      | "updatedAt";
    operator: ComparisonOperator | DateOperator;
    value: any;
    secondValue?: any; // For 'between' operator
  }>;
  matchAll?: boolean; // AND vs OR logic
}

export interface CampaignDataCondition {
  category: "campaign_data";
  conditions: Array<{
    field:
      | "status"
      | "sent"
      | "delivered"
      | "opened"
      | "clicked"
      | "bounced"
      | "complained"
      | "totalRecipients"
      | "totalClicks"
      | "open"
      | "bounces"
      | "successfulDeliveries"
      | "clicks"
      | "didNotOpen"
      | "mobileOpen"
      | "failed"
      | "hardBounces"
      | "softBounces"
      | "sentAt"
      | "createdAt"
      | "updatedAt";
    operator: ComparisonOperator | DateOperator;
    value: any;
    secondValue?: any;
  }>;
  matchAll?: boolean;
}

export interface EmailTrackingCondition {
  category: "email_tracking";
  conditions: Array<{
    field: "status" | "sentAt" | "clickedAt" | "deliveredAt" | "rejectedAt" | "bouncedAt";
    operator: ComparisonOperator | DateOperator;
    value: any;
    linkText?: string; // Filter by clicked link text
    secondValue?: any;
  }>;
  matchAll?: boolean;
}

export interface EmailTemplateCondition {
  category: "email_template";
  conditions: Array<{
    field: "category" | "componentName";
    operator: ComparisonOperator;
    value: string | string[];
  }>;
  matchAll?: boolean;
}

export interface BuyerDataCondition {
  category: "buyer_data";
  conditions: Array<{
    field: "source" | "emailstatus" | "preferredAreas";
    operator: ComparisonOperator;
    value: any;
  }>;
  matchAll?: boolean;
}

export type AutomationCondition = PropertyDataCondition | CampaignDataCondition | EmailTrackingCondition | EmailTemplateCondition | BuyerDataCondition;

// ============================================
// ACTION CONFIGURATION
// ============================================

export interface SendCampaignAction {
  type: "send_campaign";
  config: {
    campaignType: "single_property" | "multi_property";

    propertySelection: {
      source: "trigger" | "condition" | "manual";
      propertyIds?: string[];
    };

    // Email list selection - now supports Match-Title and Match-Area
    emailList: string; // Can be list ID, "Match-Title", or "Match-Area"

    emailTemplate: string;
    selectedAgent?: string;

    schedule: "immediate" | "scheduled" | "time_delay";
    scheduledDate?: Date;
    delay?: {
      amount: number;
      unit: "minutes" | "hours" | "days";
    };

    name: string;
    subject: string; // Can be "bypass" to use Landivo data
    description?: string;

    // Payment plan options for single property
    financingEnabled?: boolean;
    planStrategy?: "plan-1" | "plan-2" | "plan-3" | "monthly-low" | "monthly-high" | "down-payment-low" | "down-payment-high" | "interest-low" | "interest-high";

    // Multi-property specific
    multiPropertyConfig?: {
      sortStrategy?: "price_asc" | "price_desc" | "newest" | "oldest" | "manual";
      maxProperties?: number;
      financingEnabled?: boolean;
      planStrategy?: "plan-1" | "plan-2" | "plan-3" | "monthly-low" | "monthly-high" | "down-payment-low" | "down-payment-high" | "interest-low" | "interest-high";
    };

    componentConfig?: Record<string, any>;
    imageSelections?: Record<
      string,
      {
        propertyId?: string;
        imageIndex: number;
        imageUrl?: string;
      }
    >;
  };
}

export type AutomationAction = SendCampaignAction;

// ============================================
// AUTOMATION STRUCTURE
// ============================================

export interface Automation {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  userId: string;

  // Automation configuration
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  action: AutomationAction;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;

  // Stats
  stats?: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    lastRunStatus?: "success" | "failed";
  };
}

// ============================================
// VALIDATION TYPES
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: "error";
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  severity: "warning";
}

export type EntitySelectionSource = "trigger" | "condition" | "action";

export interface EntitySelectionState {
  property: {
    selected: boolean;
    source?: EntitySelectionSource;
    ids?: string[];
  };
  campaign: {
    selected: boolean;
    source?: EntitySelectionSource;
    ids?: string[];
  };
  buyer: {
    selected: boolean;
    source?: EntitySelectionSource;
    filters?: any;
  };
  template: {
    selected: boolean;
    source?: EntitySelectionSource;
    id?: string;
  };
}

// ============================================
// EXECUTION TYPES
// ============================================

export interface AutomationExecution {
  id: string;
  automationId: string;
  status: "pending" | "running" | "completed" | "failed";
  triggeredAt: Date;
  triggeredBy: {
    type: AutomationTriggerType;
    data: any;
  };
  completedAt?: Date;
  error?: string;
  result?: {
    campaignId?: string;
    recipientCount?: number;
    status?: string;
  };
}

export interface AutomationExecutionContext {
  automationId: string;
  userId: string;
  trigger: {
    type: AutomationTriggerType;
    data: any;
  };
  resolvedEntities: {
    properties?: any[];
    buyers?: any[];
    campaigns?: any[];
    templates?: any;
  };
}
