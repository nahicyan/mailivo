// types/workflow.ts
export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  subtype: string;
  title: string;
  description?: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  condition?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  userId: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  stats: WorkflowStats;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
}

export interface WorkflowStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgExecutionTime: number;
  conversionRate: number;
}

export interface TriggerConfig {
  campaign_sent: {
    campaignId?: string;
    segmentId?: string;
  };
  email_opened: {
    campaignId?: string;
    timeframe?: number; // hours
  };
  link_clicked: {
    campaignId?: string;
    linkUrl?: string;
  };
  contact_added: {
    listId?: string;
    source?: string;
  };
  date_trigger: {
    schedule: 'once' | 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    timezone: string;
  };
}

export interface ActionConfig {
  send_email: {
    templateId: string;
    delay: number; // hours
    fromName?: string;
    fromEmail?: string;
    subject?: string;
  };
  add_to_list: {
    listId: string;
    tags?: string[];
  };
  remove_from_list: {
    listId: string;
  };
  update_contact: {
    fields: Record<string, any>;
  };
  wait: {
    duration: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
}

export interface ConditionConfig {
  email_status: {
    status: 'opened' | 'not_opened' | 'clicked' | 'not_clicked';
    timeframe: number; // hours
  };
  contact_property: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
    value: string | number;
  };
  time_elapsed: {
    duration: number;
    unit: 'hours' | 'days' | 'weeks';
    from: 'trigger' | 'last_action';
  };
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  contactId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentNodeId: string;
  startedAt: Date;
  completedAt?: Date;
  errors: WorkflowError[];
  results: Record<string, any>;
}

export interface WorkflowError {
  nodeId: string;
  message: string;
  timestamp: Date;
  severity: 'warning' | 'error' | 'critical';
}

// API Response Types
export interface WorkflowListResponse {
  workflows: Workflow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WorkflowExecutionLog {
  id: string;
  workflowId: string;
  contactEmail: string;
  nodeExecutions: Array<{
    nodeId: string;
    nodeName: string;
    status: 'success' | 'failed' | 'skipped';
    executedAt: Date;
    duration: number;
    result?: any;
    error?: string;
  }>;
  totalDuration: number;
  createdAt: Date;
}

// Form Types
export interface WorkflowFormData {
  name: string;
  description: string;
  isActive: boolean;
  trigger: {
    type: string;
    config: Record<string, any>;
  };
  conditions: Array<{
    type: string;
    config: Record<string, any>;
    connections: string[];
  }>;
  actions: Array<{
    type: string;
    config: Record<string, any>;
    delay?: number;
  }>;
}

// Component Props
export interface WorkflowBuilderProps {
  workflowId?: string;
  onSave?: (workflow: Workflow) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export interface NodePaletteProps {
  onAddNode: (type: string, subtype: string, title: string) => void;
  availableTriggers: Array<{ id: string; label: string; icon: any; color: string }>;
  availableActions: Array<{ id: string; label: string; icon: any; color: string }>;
  availableConditions: Array<{ id: string; label: string; options: string[] }>;
}

export interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  onUpdateNode: (nodeId: string, updatedNode: WorkflowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onConnect: (fromNodeId: string, toNodeId: string) => void;
  onDisconnect: (connectionId: string) => void;
  readOnly?: boolean;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  nodeId: string;
  field: string;
  message: string;
}

export interface ValidationWarning {
  nodeId: string;
  message: string;
}

// Template Types for Quick Start
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'welcome' | 'nurture' | 'reengagement' | 'promotional' | 'transactional';
  thumbnail: string;
  nodes: Omit<WorkflowNode, 'id' | 'createdAt' | 'updatedAt'>[];
  connections: Omit<WorkflowConnection, 'id'>[];
  estimatedConversionRate: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}