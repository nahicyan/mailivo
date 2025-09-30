// api/src/integrations/landivo-setup.ts
// Simplified setup that works with your existing services

import { Redis } from 'ioredis';
import { WorkflowExecutionService } from '../services/workflow-execution-service';
import { WorkflowExecutionEngine } from '../lib/workflow-execution';
import { LandivoIntegration } from './landivo-integration';
import { emailService } from '../services/email.service';

// Create service adapters that match WorkflowExecutionEngine requirements
const contactService = {
  getContact: async (contactId: string) => ({ id: contactId }),
  updateContact: async (_contactId: string, _updates: any) => {},
  addToList: async (_contactId: string, _listId: string) => {},
  removeFromList: async (_contactId: string, _listId: string) => {},
  addTags: async (_contactId: string, _tags: string[]) => {},
  removeTags: async (_contactId: string, _tags: string[]) => {}
};

const propertyService = {
  getMatchingProperties: async (_preferences: any, _limit: number) => []
};

const schedulingService = {
  scheduleWorkflowContinuation: async (_executionId: string, _when: Date, _nodeId: string) => {}
};

// Create email service adapter
const emailServiceAdapter = {
  sendEmail: emailService.sendEmail.bind(emailService),
  getContactEmailEvents: async (_contactId: string, _campaignId?: string, _timeframe?: number) => []
};

// Initialize Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
});

// Initialize WorkflowExecutionEngine
const executionEngine = new WorkflowExecutionEngine(
  emailServiceAdapter,
  contactService,
  propertyService,
  schedulingService
);

// Initialize WorkflowExecutionService
const workflowService = new WorkflowExecutionService(redis, executionEngine);

// Initialize LandivoIntegration
export const landivoIntegration = new LandivoIntegration(
  workflowService,
  process.env.LANDIVO_API_URL
);

// Workflow trigger mappings
export const WORKFLOW_TRIGGERS = {
  PROPERTY_ADDED: process.env.WORKFLOW_PROPERTY_ADDED_ID,
  BUYER_REGISTERED: process.env.WORKFLOW_BUYER_REGISTERED_ID,
  OFFER_STATUS_CHANGED: process.env.WORKFLOW_OFFER_STATUS_ID,
  DEAL_CREATED: process.env.WORKFLOW_DEAL_CREATED_ID,
  QUALIFICATION_SUBMITTED: process.env.WORKFLOW_QUALIFICATION_ID,
  OFFER_SUBMITTED: process.env.WORKFLOW_OFFER_SUBMITTED_ID,
};

// Shutdown function
export async function shutdown() {
  await workflowService.stop();
  redis.disconnect();
}

export default landivoIntegration;