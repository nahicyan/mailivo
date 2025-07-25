// Workflow execution engine that processes logical automation flows

import { 
  Workflow, 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowExecution,
  ExecutionStep,
  EnhancedTriggerConfig,
  EnhancedActionConfig,
  EnhancedConditionConfig 
} from '@mailivo/shared-types';

export interface ExecutionContext {
  contactId: string;
  workflowId: string;
  variables: Record<string, any>;
  metadata: {
    startTime: Date;
    triggerData?: any;
    currentStep: number;
    totalSteps: number;
  };
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  nextNodeId?: string;
  shouldWait?: boolean;
  waitUntil?: Date;
}

export class WorkflowExecutionEngine {
  private emailService: EmailService;
  private contactService: ContactService;
  private propertyService: PropertyService;
  private schedulingService: SchedulingService;

  constructor(
    emailService: EmailService,
    contactService: ContactService,
    propertyService: PropertyService,
    schedulingService: SchedulingService
  ) {
    this.emailService = emailService;
    this.contactService = contactService;
    this.propertyService = propertyService;
    this.schedulingService = schedulingService;
  }

  async executeWorkflow(
    workflow: Workflow,
    contactId: string,
    triggerData?: any
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId: workflow.id,
      contactId,
      status: 'running',
      currentNodeId: '',
      startedAt: new Date(),
      executionPath: []
    };

    try {
      // Find the trigger node
      const triggerNode = workflow.nodes.find(node => node.type === 'trigger');
      if (!triggerNode) {
        throw new Error('No trigger node found in workflow');
      }

      const context: ExecutionContext = {
        contactId,
        workflowId: workflow.id,
        variables: {},
        metadata: {
          startTime: new Date(),
          triggerData,
          currentStep: 1,
          totalSteps: workflow.nodes.length
        }
      };

      // Start execution from trigger
      execution.currentNodeId = triggerNode.id;
      await this.executeNode(triggerNode, workflow, context, execution);

      execution.status = 'completed';
      execution.completedAt = new Date();

    } catch (error) {
      execution.status = 'failed';
      execution.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date();
    }

    return execution;
  }

  private async executeNode(
    node: WorkflowNode,
    workflow: Workflow,
    context: ExecutionContext,
    execution: WorkflowExecution
  ): Promise<void> {
    const step: ExecutionStep = {
      nodeId: node.id,
      executedAt: new Date(),
      result: 'success'
    };

    try {
      let result: ExecutionResult;

      switch (node.type) {
        case 'trigger':
          result = await this.executeTrigger(node, context);
          break;
        case 'action':
          result = await this.executeAction(node, context);
          break;
        case 'condition':
          result = await this.executeCondition(node, context);
          break;
        case 'wait':
          result = await this.executeWait(node, context);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      step.data = result.data;
      step.result = result.success ? 'success' : 'failed';

      if (result.shouldWait && result.waitUntil) {
        // Schedule continuation
        await this.schedulingService.scheduleWorkflowContinuation(
          execution.id,
          result.waitUntil,
          result.nextNodeId || ''
        );
        execution.status = 'paused';
        return;
      }

      // Find next node(s) to execute
      const nextNodes = await this.getNextNodes(node, workflow, result);
      
      for (const nextNode of nextNodes) {
        context.metadata.currentStep++;
        execution.currentNodeId = nextNode.id;
        await this.executeNode(nextNode, workflow, context, execution);
      }

    } catch (error) {
      step.result = 'failed';
      step.data = { error: error instanceof Error ? error.message : 'Unknown error' };
      throw error;
    } finally {
      execution.executionPath.push(step);
    }
  }

  private async executeTrigger(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    // Triggers don't perform actions, they just validate the trigger condition
    switch (node.subtype) {
      case 'contact_added':
        return { success: true, data: { trigger: 'contact_added' } };
      
      case 'campaign_sent':
        return { success: true, data: { trigger: 'campaign_sent' } };
      
      case 'new_property_match':
        const config = node.config as EnhancedTriggerConfig['new_property_match'];
        return { 
          success: true, 
          data: { 
            trigger: 'new_property_match',
            segmentId: config.segmentId,
            criteria: config.criteria
          } 
        };
      
      default:
        return { success: true, data: { trigger: node.subtype } };
    }
  }

  private async executeAction(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    switch (node.subtype) {
      case 'send_email':
        return await this.executeSendEmail(node, context);
      
      case 'send_property_alert':
        return await this.executeSendPropertyAlert(node, context);
      
      case 'add_to_list':
        return await this.executeAddToList(node, context);
      
      case 'remove_from_list':
        return await this.executeRemoveFromList(node, context);
      
      case 'update_contact':
        return await this.executeUpdateContact(node, context);
      
      case 'score_lead':
        return await this.executeScoreLead(node, context);
      
      default:
        throw new Error(`Unknown action type: ${node.subtype}`);
    }
  }

  private async executeCondition(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    switch (node.subtype) {
      case 'email_status':
        return await this.checkEmailStatus(node, context);
      
      case 'contact_property':
        return await this.checkContactProperty(node, context);
      
      case 'engagement_score':
        return await this.checkEngagementScore(node, context);
      
      case 'list_membership':
        return await this.checkListMembership(node, context);
      
      case 'property_interest':
        return await this.checkPropertyInterest(node, context);
      
      case 'purchase_history':
        return await this.checkPurchaseHistory(node, context);
      
      default:
        throw new Error(`Unknown condition type: ${node.subtype}`);
    }
  }

  private async executeWait(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const config = node.config;
    const duration = config.duration || 1;
    const unit = config.unit || 'hours';

    let milliseconds = 0;
    switch (unit) {
      case 'minutes': milliseconds = duration * 60 * 1000; break;
      case 'hours': milliseconds = duration * 60 * 60 * 1000; break;
      case 'days': milliseconds = duration * 24 * 60 * 60 * 1000; break;
      case 'weeks': milliseconds = duration * 7 * 24 * 60 * 60 * 1000; break;
    }

    const waitUntil = new Date(Date.now() + milliseconds);

    return {
      success: true,
      shouldWait: true,
      waitUntil,
      data: { waitDuration: `${duration} ${unit}`, waitUntil }
    };
  }

  // Action Implementations
  private async executeSendEmail(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const config = node.config as EnhancedActionConfig['send_email'];
    
    if (!config.templateId) {
      throw new Error('Email template ID is required');
    }

    try {
      // Apply delay if specified
      if (config.delay && config.delay.duration > 0) {
        const delayMs = this.convertToMilliseconds(config.delay.duration, config.delay.unit);
        const waitUntil = new Date(Date.now() + delayMs);
        
        return {
          success: true,
          shouldWait: true,
          waitUntil,
          data: { action: 'send_email', delayApplied: true }
        };
      }

      // Get contact details
      const contact = await this.contactService.getContact(context.contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      // Send email
      const emailResult = await this.emailService.sendEmail({
        to: contact.email,
        templateId: config.templateId,
        fromName: config.fromName,
        fromEmail: config.fromEmail,
        subject: config.subject,
        personalizations: this.buildPersonalizations(contact, context),
        campaignType: config.campaignType || 'marketing'
      });

      return {
        success: true,
        data: {
          action: 'send_email',
          emailId: emailResult.id,
          templateId: config.templateId,
          sentAt: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  private async executeSendPropertyAlert(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const config = node.config as EnhancedActionConfig['send_property_alert'];

    try {
      const contact = await this.contactService.getContact(context.contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      // Get matching properties
      const properties = await this.propertyService.getMatchingProperties(
        contact.propertyPreferences || {},
        config.maxProperties || 5
      );

      if (properties.length === 0) {
        return {
          success: true,
          data: {
            action: 'send_property_alert',
            propertiesFound: 0,
            skipped: true
          }
        };
      }

      // Send property alert
      const emailResult = await this.emailService.sendEmail({
        to: contact.email,
        templateId: config.templateId,
        personalizations: {
          ...this.buildPersonalizations(contact, context),
          properties: properties.map(p => ({
            ...p,
            imageUrl: config.includeImages ? p.imageUrl : undefined
          }))
        },
        campaignType: 'transactional'
      });

      return {
        success: true,
        data: {
          action: 'send_property_alert',
          emailId: emailResult.id,
          propertiesIncluded: properties.length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send property alert'
      };
    }
  }

  private async executeAddToList(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const config = node.config as EnhancedActionConfig['add_to_list'];

    try {
      await this.contactService.addToList(context.contactId, config.listId);
      
      if (config.tags && config.tags.length > 0) {
        await this.contactService.addTags(context.contactId, config.tags);
      }

      if (config.removeFromOtherLists && config.removeFromOtherLists.length > 0) {
        for (const listId of config.removeFromOtherLists) {
          await this.contactService.removeFromList(context.contactId, listId);
        }
      }

      return {
        success: true,
        data: {
          action: 'add_to_list',
          listId: config.listId,
          tagsAdded: config.tags || []
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add to list'
      };
    }
  }

  private async executeRemoveFromList(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const config = node.config as EnhancedActionConfig['remove_from_list'];

    try {
      await this.contactService.removeFromList(context.contactId, config.listId);

      return {
        success: true,
        data: {
          action: 'remove_from_list',
          listId: config.listId,
          reason: config.reason
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove from list'
      };
    }
  }

  private async executeUpdateContact(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const config = node.config as EnhancedActionConfig['update_contact'];

    try {
      await this.contactService.updateContact(context.contactId, config.fields);

      if (config.tags) {
        if (config.tags.add && config.tags.add.length > 0) {
          await this.contactService.addTags(context.contactId, config.tags.add);
        }
        if (config.tags.remove && config.tags.remove.length > 0) {
          await this.contactService.removeTags(context.contactId, config.tags.remove);
        }
      }

      return {
        success: true,
        data: {
          action: 'update_contact',
          fieldsUpdated: Object.keys(config.fields),
          tagsAdded: config.tags?.add || [],
          tagsRemoved: config.tags?.remove || []
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update contact'
      };
    }
  }

  private async executeScoreLead(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const config = node.config as EnhancedActionConfig['score_lead'];

    try {
      const contact = await this.contactService.getContact(context.contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      let newScore = contact.leadScore || 0;
      
      switch (config.action) {
        case 'add':
          newScore += config.points;
          break;
        case 'subtract':
          newScore -= config.points;
          break;
        case 'set':
          newScore = config.points;
          break;
        default:
          newScore += config.points;
      }

      newScore = Math.max(0, Math.min(100, newScore)); // Keep between 0-100

      await this.contactService.updateContact(context.contactId, { 
        leadScore: newScore,
        lastScoreUpdate: new Date(),
        scoreHistory: [
          ...(contact.scoreHistory || []),
          {
            points: config.points,
            reason: config.reason,
            action: config.action || 'add',
            timestamp: new Date()
          }
        ]
      });

      return {
        success: true,
        data: {
          action: 'score_lead',
          previousScore: contact.leadScore || 0,
          newScore,
          pointsChanged: config.points,
          reason: config.reason
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to score lead'
      };
    }
  }

  // Condition Implementations
  private async checkEmailStatus(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const config = node.config as EnhancedConditionConfig['email_status'];

    try {
      const emailEvents = await this.emailService.getContactEmailEvents(
        context.contactId,
        config.campaignId,
        config.timeframe
      );

      let conditionMet = false;

      switch (config.status) {
        case 'opened':
          conditionMet = emailEvents.some(event => event.type === 'open');
          break;
        case 'not_opened':
          conditionMet = !emailEvents.some(event => event.type === 'open');
          break;
        case 'clicked':
          conditionMet = emailEvents.some(event => event.type === 'click');
          break;
        case 'not_clicked':
          conditionMet = !emailEvents.some(event => event.type === 'click');
          break;
        case 'bounced':
          conditionMet = emailEvents.some(event => event.type === 'bounce');
          break;
        case 'unsubscribed':
          conditionMet = emailEvents.some(event => event.type === 'unsubscribe');
          break;
      }

      return {
        success: true,
        data: {
          condition: 'email_status',
          status: config.status,
          result: conditionMet,
          eventsFound: emailEvents.length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check email status'
      };
    }
  }

  private async checkContactProperty(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const config = node.config as EnhancedConditionConfig['contact_property'];

    try {
      const contact = await this.contactService.getContact(context.contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      const fieldValue = contact[config.field as keyof typeof contact];
      let conditionMet = false;

      switch (config.operator) {
        case 'equals':
          conditionMet = fieldValue === config.value;
          break;
        case 'not_equals':
          conditionMet = fieldValue !== config.value;
          break;
        case 'contains':
          conditionMet = String(fieldValue).toLowerCase().includes(String(config.value).toLowerCase());
          break;
        case 'not_contains':
          conditionMet = !String(fieldValue).toLowerCase().includes(String(config.value).toLowerCase());
          break;
        case 'greater_than':
          conditionMet = Number(fieldValue) > Number(config.value);
          break;
        case 'less_than':
          conditionMet = Number(fieldValue) < Number(config.value);
          break;
        case 'exists':
          conditionMet = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
          break;
        case 'not_exists':
          conditionMet = fieldValue === null || fieldValue === undefined || fieldValue === '';
          break;
      }

      return {
        success: true,
        data: {
          condition: 'contact_property',
          field: config.field,
          operator: config.operator,
          value: config.value,
          fieldValue,
          result: conditionMet
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check contact property'
      };
    }
  }

  // Helper methods
  private async getNextNodes(
    currentNode: WorkflowNode,
    workflow: Workflow,
    result: ExecutionResult
  ): Promise<WorkflowNode[]> {
    const connections = workflow.connections.filter(conn => conn.from === currentNode.id);
    
    if (currentNode.type === 'condition') {
      // For conditions, choose path based on result
      const conditionResult = result.data?.result || false;
      const targetCondition = conditionResult ? 'yes' : 'no';
      
      const connection = connections.find(conn => conn.condition === targetCondition);
      if (connection) {
        const nextNode = workflow.nodes.find(node => node.id === connection.to);
        return nextNode ? [nextNode] : [];
      }
    } else {
      // For other nodes, follow all outgoing connections
      const nextNodes = connections
        .map(conn => workflow.nodes.find(node => node.id === conn.to))
        .filter(node => node !== undefined) as WorkflowNode[];
      
      return nextNodes;
    }

    return [];
  }

  private convertToMilliseconds(duration: number, unit: string): number {
    switch (unit) {
      case 'minutes': return duration * 60 * 1000;
      case 'hours': return duration * 60 * 60 * 1000;
      case 'days': return duration * 24 * 60 * 60 * 1000;
      case 'weeks': return duration * 7 * 24 * 60 * 60 * 1000;
      default: return duration * 60 * 60 * 1000; // Default to hours
    }
  }

  private buildPersonalizations(contact: any, context: ExecutionContext): Record<string, any> {
    return {
      firstName: contact.firstName || 'Friend',
      lastName: contact.lastName || '',
      email: contact.email,
      city: contact.city || '',
      preferences: contact.propertyPreferences || {},
      leadScore: contact.leadScore || 0,
      workflowId: context.workflowId,
      executionId: context.metadata?.executionId || ''
    };
  }

  // Placeholder for missing condition implementations
  private async checkEngagementScore(node: WorkflowNode, context: ExecutionContext): Promise<ExecutionResult> {
    // Implementation for engagement score checking
    return { success: true, data: { result: true } };
  }

  private async checkListMembership(node: WorkflowNode, context: ExecutionContext): Promise<ExecutionResult> {
    // Implementation for list membership checking
    return { success: true, data: { result: true } };
  }

  private async checkPropertyInterest(node: WorkflowNode, context: ExecutionContext): Promise<ExecutionResult> {
    // Implementation for property interest checking
    return { success: true, data: { result: true } };
  }

  private async checkPurchaseHistory(node: WorkflowNode, context: ExecutionContext): Promise<ExecutionResult> {
    // Implementation for purchase history checking
    return { success: true, data: { result: true } };
  }
}

// Service interfaces (these would be implemented separately)
interface EmailService {
  sendEmail(params: any): Promise<any>;
  getContactEmailEvents(contactId: string, campaignId?: string, timeframe?: number): Promise<any[]>;
}

interface ContactService {
  getContact(contactId: string): Promise<any>;
  updateContact(contactId: string, updates: any): Promise<void>;
  addToList(contactId: string, listId: string): Promise<void>;
  removeFromList(contactId: string, listId: string): Promise<void>;
  addTags(contactId: string, tags: string[]): Promise<void>;
  removeTags(contactId: string, tags: string[]): Promise<void>;
}

interface PropertyService {
  getMatchingProperties(preferences: any, limit: number): Promise<any[]>;
}

interface SchedulingService {
  scheduleWorkflowContinuation(executionId: string, when: Date, nodeId: string): Promise<void>;
}