// api/src/integrations/landivo-setup.ts
// Proper initialization of LandivoIntegration with all dependencies

import { Redis } from 'ioredis';
import { WorkflowExecutionService } from '../services/workflow-execution-service';
import { WorkflowExecutionEngine } from '../lib/workflow-execution';
import { LandivoIntegration } from './landivo-integration';

// Import your existing services
import { emailService } from '../services/email.service';
import { contactService } from '../services/contact.service';
import { propertyService } from '../services/property.service';
import { schedulingService } from '../services/scheduling.service';

// Initialize Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
});

// Initialize WorkflowExecutionEngine
const executionEngine = new WorkflowExecutionEngine(
  emailService,
  contactService,
  propertyService,
  schedulingService
);

// Initialize WorkflowExecutionService
const workflowService = new WorkflowExecutionService(redis, executionEngine);

// Initialize LandivoIntegration with proper dependencies
export const landivoIntegration = new LandivoIntegration(
  workflowService,
  process.env.LANDIVO_API_URL
);

// Optional: Map workflow triggers to workflow IDs from environment or database
export const WORKFLOW_TRIGGERS = {
  PROPERTY_ADDED: process.env.WORKFLOW_PROPERTY_ADDED_ID,
  BUYER_REGISTERED: process.env.WORKFLOW_BUYER_REGISTERED_ID,
  OFFER_STATUS_CHANGED: process.env.WORKFLOW_OFFER_STATUS_ID,
  DEAL_CREATED: process.env.WORKFLOW_DEAL_CREATED_ID,
  QUALIFICATION_SUBMITTED: process.env.WORKFLOW_QUALIFICATION_ID,
  OFFER_SUBMITTED: process.env.WORKFLOW_OFFER_SUBMITTED_ID,
};

// Example usage with workflow IDs:
export async function handleNewProperty(property: any) {
  await landivoIntegration.onPropertyAdded(
    property,
    WORKFLOW_TRIGGERS.PROPERTY_ADDED
  );
}

export async function handleNewBuyer(buyer: any) {
  await landivoIntegration.onBuyerRegistered(
    buyer,
    WORKFLOW_TRIGGERS.BUYER_REGISTERED
  );
}

export async function handleNewOffer(offerData: any) {
  await landivoIntegration.makeOffer(
    offerData,
    WORKFLOW_TRIGGERS.OFFER_SUBMITTED
  );
}

// Clean shutdown function
export async function shutdown() {
  await workflowService.stop();
  redis.disconnect();
}

// Export for use in other parts of the application
export default landivoIntegration;