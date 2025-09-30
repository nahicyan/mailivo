// packages/shared-types/src/workflow-enhanced.ts

export interface EnhancedWorkflowTrigger {
  property_uploaded: {
    propertyId?: string;
    matchCriteria?: PropertyCriteria;
  };
  time_based: {
    schedule: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time?: string; // HH:mm format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    timezone?: string;
  };
  property_viewed: {
    propertyId?: string;
    viewCount?: number;
    uniqueViews?: boolean;
    timeframe?: number; // hours
  };
  property_updated: {
    propertyId?: string;
    fields?: string[]; // specific fields to monitor
    changeType?: 'price_drop' | 'price_increase' | 'status_change' | 'any';
  };
  campaign_status: {
    campaignId?: string;
    status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'completed';
    threshold?: number; // percentage for metrics
  };
  email_tracking: {
    action: 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'complained';
    linkText?: string; // for click tracking
    timeframe?: number; // hours to wait
  };
  unsubscribe: {
    listId?: string;
    reason?: string;
  };
}

export interface EnhancedWorkflowCondition {
  property_data: {
    operator: 'AND' | 'OR';
    filters: {
      // Multi-select fields
      area?: string[];
      status?: string[];
      featured?: boolean;
      landtype?: string[];
      zoning?: string[];
      city?: string[];
      county?: string[];
      state?: string[];
      zip?: string[];
      water?: string[];
      sewer?: string[];
      electric?: string[];
      roadCondition?: string[];
      floodplain?: string[];
      ltag?: string[];
      rtag?: string[];
      
      // Boolean fields
      mobilehomefriendly?: boolean;
      financing?: boolean;
      financingTwo?: boolean;
      financingThree?: boolean;
      hoapoa?: boolean;
      hascma?: boolean;
      
      // Numeric fields with operators
      sqft?: NumericFilter;
      acre?: NumericFilter;
      askingprice?: NumericFilter;
      minprice?: NumericFilter;
      disprice?: NumericFilter;
      purchasePrice?: NumericFilter;
      financedPrice?: NumericFilter;
      
      // Date fields
      createdAt?: DateFilter;
      updatedAt?: DateFilter;
      
      // Geo fields
      longitude?: number;
      latitude?: number;
      radius?: number; // for geo queries
    };
  };
  campaign_data: {
    status?: string[];
    metrics?: {
      field: string;
      operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
      value: number;
      value2?: number; // for between operator
    }[];
    sentAt?: DateFilter;
    createdAt?: DateFilter;
    updatedAt?: DateFilter;
  };
  email_tracking: {
    matchLinks?: string[]; // LinkText from templates
    timeframe?: DateFilter;
    status?: string[];
  };
  email_templates: {
    category?: string[];
    componentNames?: string[];
  };
  buyer_data: {
    source?: string[];
    emailstatus?: string[];
    preferredAreas?: string[];
    scoreRange?: NumericFilter;
  };
}

interface NumericFilter {
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
  value: number;
  value2?: number; // for between operator
}

interface DateFilter {
  operator: 'before' | 'after' | 'on' | 'between' | 'last_n_days';
  value: string | Date;
  value2?: string | Date; // for between
  days?: number; // for last_n_days
}