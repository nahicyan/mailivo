// Enhanced database schemas for the workflow system with MongoDB/Mongoose

import mongoose, { Schema, Document } from 'mongoose';

// Workflow Node Schema
const WorkflowNodeSchema = new Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['trigger', 'action', 'condition', 'wait'] 
  },
  subtype: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  config: { type: Schema.Types.Mixed, default: {} },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  connections: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Workflow Connection Schema
const WorkflowConnectionSchema = new Schema({
  id: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  condition: { type: String, enum: ['yes', 'no', 'default'] },
  label: { type: String }
});

// Workflow Statistics Schema
const WorkflowStatsSchema = new Schema({
  totalRuns: { type: Number, default: 0 },
  successfulRuns: { type: Number, default: 0 },
  failedRuns: { type: Number, default: 0 },
  pausedRuns: { type: Number, default: 0 },
  avgExecutionTime: { type: Number, default: 0 }, // in seconds
  conversionRate: { type: Number, default: 0 }, // percentage
  lastRunAt: { type: Date },
  lastSuccessAt: { type: Date },
  lastFailureAt: { type: Date }
});

// Main Workflow Schema
const WorkflowSchema = new Schema({
  name: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 1000 },
  category: { 
    type: String, 
    required: true,
    enum: [
      'welcome_series',
      'drip_campaign', 
      'abandoned_cart',
      'lead_nurturing',
      'reengagement',
      'post_purchase',
      'property_alerts',
      'custom'
    ]
  },
  template: { type: String }, // Reference to template ID if created from template
  isActive: { type: Boolean, default: false },
  userId: { type: String, required: true, index: true },
  
  // Workflow Structure
  nodes: [WorkflowNodeSchema],
  connections: [WorkflowConnectionSchema],
  
  // Metadata
  tags: [{ type: String }],
  priority: { type: Number, default: 0 }, // For execution prioritization
  
  // Validation & Health
  validationStatus: {
    isValid: { type: Boolean, default: false },
    lastValidatedAt: { type: Date },
    errors: [{
      type: { type: String },
      message: { type: String },
      nodeId: { type: String },
      severity: { type: String, enum: ['critical', 'error', 'warning'] }
    }],
    warnings: [{
      message: { type: String },
      nodeId: { type: String },
      suggestion: { type: String }
    }]
  },
  
  healthScore: {
    score: { type: Number, min: 0, max: 100, default: 0 },
    grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'F' },
    lastCalculatedAt: { type: Date, default: Date.now }
  },
  
  // Execution Settings
  executionSettings: {
    maxConcurrentRuns: { type: Number, default: 100 },
    retryFailedNodes: { type: Boolean, default: true },
    maxRetries: { type: Number, default: 3 },
    timeoutMinutes: { type: Number, default: 60 },
    timezone: { type: String, default: 'UTC' }
  },
  
  // Performance & Analytics
  stats: WorkflowStatsSchema,
  
  // Trigger Configuration
  triggerConfig: {
    enabled: { type: Boolean, default: true },
    conditions: { type: Schema.Types.Mixed },
    frequency: { type: String, enum: ['immediate', 'batched', 'scheduled'] },
    batchSize: { type: Number, default: 100 },
    scheduleExpression: { type: String } // Cron expression for scheduled triggers
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActivatedAt: { type: Date },
  lastDeactivatedAt: { type: Date },
  lastRunAt: { type: Date }
}, {
  timestamps: true,
  collection: 'workflows'
});

// Execution Step Schema
const ExecutionStepSchema = new Schema({
  nodeId: { type: String, required: true },
  executedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  result: { 
    type: String, 
    required: true, 
    enum: ['success', 'failed', 'skipped', 'timeout'] 
  },
  data: { type: Schema.Types.Mixed },
  error: { type: String },
  duration: { type: Number }, // milliseconds
  retryCount: { type: Number, default: 0 }
});

// Workflow Execution Schema
const WorkflowExecutionSchema = new Schema({
  workflowId: { type: String, required: true, index: true },
  contactId: { type: String, required: true, index: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'running', 'completed', 'failed', 'paused', 'cancelled'],
    index: true
  },
  currentNodeId: { type: String },
  
  // Execution Context
  context: {
    variables: { type: Schema.Types.Mixed, default: {} },
    triggerData: { type: Schema.Types.Mixed },
    metadata: {
      startTime: { type: Date },
      expectedEndTime: { type: Date },
      currentStep: { type: Number, default: 1 },
      totalSteps: { type: Number },
      retryCount: { type: Number, default: 0 },
      priority: { type: Number, default: 0 }
    }
  },
  
  // Execution Path
  executionPath: [ExecutionStepSchema],
  
  // Scheduling
  scheduledAt: { type: Date },
  pausedAt: { type: Date },
  pauseReason: { type: String },
  resumeAt: { type: Date },
  
  // Results
  result: {
    success: { type: Boolean },
    data: { type: Schema.Types.Mixed },
    conversions: [{
      type: { type: String }, // 'email_open', 'click', 'purchase', etc.
      value: { type: Number },
      timestamp: { type: Date },
      data: { type: Schema.Types.Mixed }
    }]
  },
  
  // Error Handling
  errorMessage: { type: String },
  errorDetails: { type: Schema.Types.Mixed },
  failedNodeId: { type: String },
  
  // Performance
  totalDuration: { type: Number }, // milliseconds
  nodeExecutionTimes: { type: Map, of: Number }, // nodeId -> duration
  
  // Timestamps
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  lastActivityAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'workflow_executions'
});

// Workflow Template Usage Schema
const WorkflowTemplateUsageSchema = new Schema({
  templateId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  workflowId: { type: String, required: true },
  customizations: { type: Schema.Types.Mixed },
  performance: {
    avgOpenRate: { type: Number },
    avgClickRate: { type: Number },
    avgConversionRate: { type: Number },
    totalExecutions: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'workflow_template_usage'
});

// Workflow Analytics Aggregation Schema (for performance)
const WorkflowAnalyticsSchema = new Schema({
  workflowId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  period: { type: String, required: true }, // 'daily', 'weekly', 'monthly'
  date: { type: Date, required: true, index: true },
  
  metrics: {
    executions: { type: Number, default: 0 },
    successfulExecutions: { type: Number, default: 0 },
    failedExecutions: { type: Number, default: 0 },
    pausedExecutions: { type: Number, default: 0 },
    
    avgExecutionTime: { type: Number, default: 0 },
    totalContactsProcessed: { type: Number, default: 0 },
    uniqueContactsProcessed: { type: Number, default: 0 },
    
    emailsSent: { type: Number, default: 0 },
    emailsOpened: { type: Number, default: 0 },
    emailsClicked: { type: Number, default: 0 },
    emailsBounced: { type: Number, default: 0 },
    unsubscribes: { type: Number, default: 0 },
    
    conversions: { type: Number, default: 0 },
    conversionValue: { type: Number, default: 0 },
    
    // Node-specific metrics
    nodeMetrics: [{
      nodeId: { type: String },
      nodeType: { type: String },
      executions: { type: Number, default: 0 },
      successes: { type: Number, default: 0 },
      failures: { type: Number, default: 0 },
      avgDuration: { type: Number, default: 0 }
    }]
  },
  
  // Calculated rates
  rates: {
    successRate: { type: Number, default: 0 },
    failureRate: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    unsubscribeRate: { type: Number, default: 0 }
  },
  
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'workflow_analytics'
});

// Scheduled Workflow Jobs Schema
const ScheduledWorkflowJobSchema = new Schema({
  workflowId: { type: String, required: true, index: true },
  executionId: { type: String, index: true },
  contactId: { type: String, required: true },
  nodeId: { type: String, required: true },
  
  jobType: { 
    type: String, 
    required: true, 
    enum: ['wait_delay', 'schedule_trigger', 'retry_failed', 'timeout_check'] 
  },
  
  scheduledAt: { type: Date, required: true, index: true },
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] 
  },
  
  priority: { type: Number, default: 0 },
  
  data: { type: Schema.Types.Mixed },
  
  // Retry logic
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  nextRetryAt: { type: Date },
  
  // Results
  processedAt: { type: Date },
  completedAt: { type: Date },
  error: { type: String },
  
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'scheduled_workflow_jobs'
});

// Indexes for performance
WorkflowSchema.index({ userId: 1, isActive: 1 });
WorkflowSchema.index({ category: 1, isActive: 1 });
WorkflowSchema.index({ 'stats.lastRunAt': -1 });
WorkflowSchema.index({ 'healthScore.score': -1 });
WorkflowSchema.index({ updatedAt: -1 });

WorkflowExecutionSchema.index({ workflowId: 1, status: 1 });
WorkflowExecutionSchema.index({ contactId: 1, startedAt: -1 });
WorkflowExecutionSchema.index({ status: 1, scheduledAt: 1 });
WorkflowExecutionSchema.index({ startedAt: -1 });

WorkflowAnalyticsSchema.index({ workflowId: 1, period: 1, date: -1 });
WorkflowAnalyticsSchema.index({ userId: 1, date: -1 });

ScheduledWorkflowJobSchema.index({ scheduledAt: 1, status: 1 });
ScheduledWorkflowJobSchema.index({ workflowId: 1, jobType: 1 });

// Create Models
export interface IWorkflow extends Document {
  name: string;
  description?: string;
  category: string;
  template?: string;
  isActive: boolean;
  userId: string;
  nodes: any[];
  connections: any[];
  tags: string[];
  priority: number;
  validationStatus: any;
  healthScore: any;
  executionSettings: any;
  stats: any;
  triggerConfig: any;
  createdAt: Date;
  updatedAt: Date;
  lastActivatedAt?: Date;
  lastDeactivatedAt?: Date;
  lastRunAt?: Date;
}

export interface IWorkflowExecution extends Document {
  workflowId: string;
  contactId: string;
  status: string;
  currentNodeId?: string;
  context: any;
  executionPath: any[];
  scheduledAt?: Date;
  pausedAt?: Date;
  pauseReason?: string;
  resumeAt?: Date;
  result?: any;
  errorMessage?: string;
  errorDetails?: any;
  failedNodeId?: string;
  totalDuration?: number;
  nodeExecutionTimes?: Map<string, number>;
  startedAt: Date;
  completedAt?: Date;
  lastActivityAt: Date;
}

export interface IWorkflowAnalytics extends Document {
  workflowId: string;
  userId: string;
  period: string;
  date: Date;
  metrics: any;
  rates: any;
  updatedAt: Date;
}

export interface IScheduledWorkflowJob extends Document {
  workflowId: string;
  executionId?: string;
  contactId: string;
  nodeId: string;
  jobType: string;
  scheduledAt: Date;
  status: string;
  priority: number;
  data?: any;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  processedAt?: Date;
  completedAt?: Date;
  error?: string;
  createdAt: Date;
}

// Export Models
export const Workflow = mongoose.models.Workflow || mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
export const WorkflowExecution = mongoose.models.WorkflowExecution || mongoose.model<IWorkflowExecution>('WorkflowExecution', WorkflowExecutionSchema);
export const WorkflowTemplateUsage = mongoose.models.WorkflowTemplateUsage || mongoose.model('WorkflowTemplateUsage', WorkflowTemplateUsageSchema);
export const WorkflowAnalytics = mongoose.models.WorkflowAnalytics || mongoose.model<IWorkflowAnalytics>('WorkflowAnalytics', WorkflowAnalyticsSchema);
export const ScheduledWorkflowJob = mongoose.models.ScheduledWorkflowJob || mongoose.model<IScheduledWorkflowJob>('ScheduledWorkflowJob', ScheduledWorkflowJobSchema);

// Helper functions for database operations
export class WorkflowDatabase {
  
  // Create workflow with validation
  static async createWorkflow(workflowData: Partial<IWorkflow>): Promise<IWorkflow> {
    const workflow = new Workflow(workflowData);
    await workflow.save();
    return workflow;
  }
  
  // Update workflow health score
  static async updateHealthScore(workflowId: string, score: number, grade: string): Promise<void> {
    await Workflow.findByIdAndUpdate(workflowId, {
      'healthScore.score': score,
      'healthScore.grade': grade,
      'healthScore.lastCalculatedAt': new Date()
    });
  }
  
  // Update workflow statistics
  static async updateWorkflowStats(workflowId: string, executionResult: any): Promise<void> {
    const updateQuery: any = {
      $inc: {
        'stats.totalRuns': 1,
        'stats.successfulRuns': executionResult.success ? 1 : 0,
        'stats.failedRuns': executionResult.success ? 0 : 1
      },
      $set: {
        'stats.lastRunAt': new Date(),
        'stats.avgExecutionTime': executionResult.duration || 0
      }
    };
    
    if (executionResult.success) {
      updateQuery.$set['stats.lastSuccessAt'] = new Date();
    } else {
      updateQuery.$set['stats.lastFailureAt'] = new Date();
    }
    
    await Workflow.findByIdAndUpdate(workflowId, updateQuery);
  }
  
  // Get active workflows for execution
  static async getActiveWorkflows(category?: string): Promise<IWorkflow[]> {
    const query: any = { isActive: true, 'validationStatus.isValid': true };
    if (category) query.category = category;
    
    return await Workflow.find(query).sort({ priority: -1, updatedAt: -1 });
  }
  
  // Create execution record
  static async createExecution(executionData: Partial<IWorkflowExecution>): Promise<IWorkflowExecution> {
    const execution = new WorkflowExecution(executionData);
    await execution.save();
    return execution;
  }
  
  // Update execution status
  static async updateExecutionStatus(
    executionId: string, 
    status: string, 
    data?: any
  ): Promise<void> {
    const updateData: any = { 
      status, 
      lastActivityAt: new Date() 
    };
    
    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }
    
    if (data) {
      updateData.result = data;
    }
    
    await WorkflowExecution.findByIdAndUpdate(executionId, updateData);
  }
  
  // Schedule workflow job
  static async scheduleJob(jobData: Partial<IScheduledWorkflowJob>): Promise<IScheduledWorkflowJob> {
    const job = new ScheduledWorkflowJob(jobData);
    await job.save();
    return job;
  }
  
  // Get due scheduled jobs
  static async getDueJobs(limit = 100): Promise<IScheduledWorkflowJob[]> {
    return await ScheduledWorkflowJob.find({
      scheduledAt: { $lte: new Date() },
      status: 'pending'
    })
    .sort({ priority: -1, scheduledAt: 1 })
    .limit(limit);
  }
  
  // Aggregate workflow analytics
  static async aggregateAnalytics(workflowId: string, period: string, startDate: Date, endDate: Date): Promise<any> {
    const pipeline = [
      {
        $match: {
          workflowId,
          startedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalExecutions: { $sum: 1 },
          successfulExecutions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          failedExecutions: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          avgDuration: { $avg: '$totalDuration' },
          totalContactsProcessed: { $addToSet: '$contactId' }
        }
      },
      {
        $project: {
          totalExecutions: 1,
          successfulExecutions: 1,
          failedExecutions: 1,
          avgDuration: 1,
          uniqueContactsProcessed: { $size: '$totalContactsProcessed' },
          successRate: { 
            $multiply: [
              { $divide: ['$successfulExecutions', '$totalExecutions'] }, 
              100
            ] 
          }
        }
      }
    ];
    
    const result = await WorkflowExecution.aggregate(pipeline);
    return result[0] || {};
  }
  
  // Clean up old executions
  static async cleanupOldExecutions(daysToKeep = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    await WorkflowExecution.deleteMany({
      completedAt: { $lt: cutoffDate },
      status: { $in: ['completed', 'failed'] }
    });
  }
}