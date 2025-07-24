import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  subtype: string;
  title: string;
  description?: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface IWorkflowConnection {
  from: string;
  to: string;
  condition?: string;
}

export interface IWorkflow extends Document {
  name: string;
  description: string;
  isActive: boolean;
  userId: string;
  nodes: IWorkflowNode[];
  connections: IWorkflowConnection[];
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
}

const WorkflowNodeSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['trigger', 'action', 'condition'], required: true },
  subtype: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  config: { type: Schema.Types.Mixed, default: {} },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
});

const WorkflowConnectionSchema = new Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  condition: { type: String }
});

const WorkflowSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: false },
  userId: { type: String, required: true, index: true },
  nodes: [WorkflowNodeSchema],
  connections: [WorkflowConnectionSchema],
  lastRunAt: { type: Date }
}, {
  timestamps: true
});

WorkflowSchema.index({ userId: 1, createdAt: -1 });
WorkflowSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<IWorkflow>('Workflow', WorkflowSchema);