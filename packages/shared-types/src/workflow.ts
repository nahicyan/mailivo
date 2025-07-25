// Enhanced workflow types with logical flow enforcement

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'wait';
  subtype: string;
  title: string;
  description?: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[]; // IDs of connected nodes
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  condition?: 'yes' | 'no' | 'default';
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  template?: string; // Pre-built template ID
  isActive: boolean;
  userId?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  stats?: WorkflowStats;
  createdAt?: Date;
  updatedAt?: Date;
  lastRunAt?: Date;
}

export type WorkflowCategory = 
  | 'welcome_series'
  | 'drip_campaign' 
  | 'abandoned_cart'
  | 'lead_nurturing'
  | 'reengagement'
  | 'post_purchase'
  | 'property_alerts'
  | 'custom';

// Enhanced trigger configs with time-based logic
export interface EnhancedTriggerConfig {
  // Campaign-based triggers
  campaign_sent: {
    campaignId: string;
    delay?: DelayConfig; // Optional delay after campaign sent
  };
  
  // Time-based triggers
  time_delay: {
    duration: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
    after: 'campaign_sent' | 'email_opened' | 'signup' | 'purchase';
  };
  
  // Behavioral triggers
  email_opened: {
    campaignId?: string;
    timeframe: number; // hours to wait
  };
  
  email_not_opened: {
    campaignId?: string;
    timeframe: number; // hours to wait before triggering
  };
  
  link_clicked: {
    campaignId?: string;
    linkUrl?: string;
    timeframe?: number;
  };
  
  // Landivo-specific triggers
  property_viewed: {
    propertyType?: string[];
    location?: string[];
    priceRange?: { min: number; max: number };
  };
  
  new_property_match: {
    segmentId: string;
    criteria: PropertyCriteria;
  };
  
  contact_added: {
    listId?: string;
    source?: 'landivo' | 'manual' | 'import' | 'api';
    tags?: string[];
  };
}

export interface PropertyCriteria {
  location: string[];
  propertyType: string[];
  priceRange: { min: number; max: number };
  bedrooms?: number;
  bathrooms?: number;
}

export interface DelayConfig {
  duration: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
}

// Enhanced action configs
export interface EnhancedActionConfig {
  send_email: {
    templateId: string;
    campaignType: 'transactional' | 'marketing';
    delay?: DelayConfig;
    fromName?: string;
    fromEmail?: string;
    subject?: string;
    personalization?: PersonalizationField[];
  };
  
  wait: DelayConfig;
  
  add_to_list: {
    listId: string;
    tags?: string[];
    removeFromOtherLists?: string[];
  };
  
  remove_from_list: {
    listId: string;
    reason?: string;
  };
  
  update_contact: {
    fields: Record<string, any>;
    tags?: { add?: string[]; remove?: string[] };
  };
  
  send_property_alert: {
    templateId: string;
    propertyIds?: string[];
    maxProperties?: number;
    includeImages: boolean;
  };
  
  score_lead: {
    points: number;
    reason: string;
    action?: 'add' | 'subtract' | 'set';
  };
}

export interface PersonalizationField {
  field: string;
  fallback?: string;
}

// Enhanced condition configs
export interface EnhancedConditionConfig {
  email_status: {
    status: 'opened' | 'not_opened' | 'clicked' | 'not_clicked' | 'bounced' | 'unsubscribed';
    timeframe: number; // hours
    campaignId?: string;
  };
  
  contact_property: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
    value: string | number | boolean;
  };
  
  engagement_score: {
    operator: 'greater_than' | 'less_than' | 'equals';
    value: number;
    timeframe?: number; // days to look back
  };
  
  list_membership: {
    listId: string;
    isMember: boolean;
  };
  
  purchase_history: {
    hasPurchased: boolean;
    timeframe?: number; // days
    minAmount?: number;
  };
  
  property_interest: {
    hasViewed: boolean;
    propertyType?: string[];
    location?: string[];
    timeframe?: number; // days
  };
}

// Workflow templates for common patterns
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  industry?: 'real_estate' | 'ecommerce' | 'saas' | 'general';
  nodes: Omit<WorkflowNode, 'id' | 'position'>[];
  connections: Omit<WorkflowConnection, 'id' | 'from' | 'to'>[];
  estimatedDuration: string;
  expectedResults: {
    openRate: string;
    clickRate: string;
    conversionRate: string;
  };
}

// Pre-defined workflow templates
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'welcome_series_basic',
    name: 'Welcome Email Series',
    description: 'A 3-email welcome sequence for new subscribers',
    category: 'welcome_series',
    industry: 'general',
    estimatedDuration: '1 week',
    expectedResults: {
      openRate: '45-55%',
      clickRate: '8-12%',
      conversionRate: '3-7%'
    },
    nodes: [
      {
        type: 'trigger',
        subtype: 'contact_added',
        title: 'New Subscriber',
        config: { source: 'any' }
      },
      {
        type: 'action',
        subtype: 'send_email',
        title: 'Welcome Email',
        config: { templateId: 'welcome_1', delay: { duration: 0, unit: 'minutes' } }
      },
      {
        type: 'wait',
        subtype: 'time_delay',
        title: 'Wait 2 Days',
        config: { duration: 2, unit: 'days' }
      },
      {
        type: 'condition',
        subtype: 'email_status',
        title: 'Opened Welcome?',
        config: { status: 'opened', timeframe: 48 }
      },
      {
        type: 'action',
        subtype: 'send_email',
        title: 'Getting Started Tips',
        config: { templateId: 'welcome_2', delay: { duration: 0, unit: 'minutes' } }
      },
      {
        type: 'wait',
        subtype: 'time_delay',
        title: 'Wait 3 Days',
        config: { duration: 3, unit: 'days' }
      },
      {
        type: 'action',
        subtype: 'send_email',
        title: 'Best Resources',
        config: { templateId: 'welcome_3', delay: { duration: 0, unit: 'minutes' } }
      }
    ],
    connections: []
  },
  {
    id: 'property_alert_sequence',
    name: 'Property Alert Sequence',
    description: 'Automated property notifications for Landivo buyers',
    category: 'property_alerts',
    industry: 'real_estate',
    estimatedDuration: 'Ongoing',
    expectedResults: {
      openRate: '35-45%',
      clickRate: '5-10%',
      conversionRate: '2-5%'
    },
    nodes: [
      {
        type: 'trigger',
        subtype: 'new_property_match',
        title: 'New Property Match',
        config: { segmentId: '', criteria: {} }
      },
      {
        type: 'action',
        subtype: 'send_property_alert',
        title: 'Send Property Alert',
        config: { templateId: 'property_alert', maxProperties: 5 }
      },
      {
        type: 'wait',
        subtype: 'time_delay',
        title: 'Wait 24 Hours',
        config: { duration: 24, unit: 'hours' }
      },
      {
        type: 'condition',
        subtype: 'email_status',
        title: 'Clicked Property?',
        config: { status: 'clicked', timeframe: 24 }
      },
      {
        type: 'action',
        subtype: 'send_email',
        title: 'Follow-up Info',
        config: { templateId: 'property_followup' }
      }
    ],
    connections: []
  },
  {
    id: 'abandoned_cart_recovery',
    name: 'Abandoned Cart Recovery',
    description: '3-email sequence to recover abandoned shopping carts',
    category: 'abandoned_cart',
    industry: 'ecommerce',
    estimatedDuration: '1 week',
    expectedResults: {
      openRate: '40-50%',
      clickRate: '10-15%',
      conversionRate: '5-12%'
    },
    nodes: [
      {
        type: 'trigger',
        subtype: 'cart_abandoned',
        title: 'Cart Abandoned',
        config: { timeframe: 1 }
      },
      {
        type: 'wait',
        subtype: 'time_delay',
        title: 'Wait 1 Hour',
        config: { duration: 1, unit: 'hours' }
      },
      {
        type: 'action',
        subtype: 'send_email',
        title: 'Cart Reminder',
        config: { templateId: 'cart_reminder_1' }
      },
      {
        type: 'wait',
        subtype: 'time_delay',
        title: 'Wait 24 Hours',
        config: { duration: 24, unit: 'hours' }
      },
      {
        type: 'condition',
        subtype: 'purchase_history',
        title: 'Purchase Made?',
        config: { hasPurchased: true, timeframe: 1 }
      },
      {
        type: 'action',
        subtype: 'send_email',
        title: 'Discount Offer',
        config: { templateId: 'cart_discount' }
      }
    ],
    connections: []
  }
];

// Validation rules for workflow logic
export interface WorkflowValidationRule {
  type: 'node_sequence' | 'connection_logic' | 'template_compliance';
  rule: string;
  message: string;
}

export const WORKFLOW_VALIDATION_RULES: WorkflowValidationRule[] = [
  {
    type: 'node_sequence',
    rule: 'workflow_must_start_with_trigger',
    message: 'Every workflow must start with exactly one trigger node'
  },
  {
    type: 'node_sequence', 
    rule: 'trigger_cannot_have_incoming_connections',
    message: 'Trigger nodes cannot have incoming connections'
  },
  {
    type: 'connection_logic',
    rule: 'condition_must_have_two_paths',
    message: 'Condition nodes must have exactly two outgoing connections (Yes/No)'
  },
  {
    type: 'connection_logic',
    rule: 'action_requires_single_input',
    message: 'Action nodes can only have one incoming connection'
  },
  {
    type: 'template_compliance',
    rule: 'minimum_nodes_required',
    message: 'Workflows must have at least: 1 trigger + 1 action'
  }
];

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  contactId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentNodeId: string;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  executionPath: ExecutionStep[];
}

export interface ExecutionStep {
  nodeId: string;
  executedAt: Date;
  result: 'success' | 'failed' | 'skipped';
  data?: any;
}