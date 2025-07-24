import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowExecution extends Document {
  workflowId: string;
  contactId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentNodeId?: string;
  startedAt: Date;
  completedAt?: Date;
  results: Record<string, any>;
  executionErrors?: Array<{
    nodeId: string;
    message: string;
    timestamp: Date;
  }>;
}

const WorkflowExecutionSchema = new Schema({
  workflowId: { 
    type: String, 
    required: true,
    index: true
  },
  contactId: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['running', 'completed', 'failed', 'paused'],
    default: 'running'
  },
  currentNodeId: { 
    type: String 
  },
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: { 
    type: Date 
  },
  results: { 
    type: Schema.Types.Mixed, 
    default: {} 
  },
  executionErrors: [{
    nodeId: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for performance
WorkflowExecutionSchema.index({ workflowId: 1, status: 1 });
WorkflowExecutionSchema.index({ contactId: 1, startedAt: -1 });

export default mongoose.model<IWorkflowExecution>('WorkflowExecution', WorkflowExecutionSchema);