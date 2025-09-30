// api/src/services/workflow-execution.service.ts

import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';

export interface WorkflowExecutionContext {
  workflowId: string;
  triggerId: string;
  triggerData: any;
  conditions: any[];
  action: any;
  metadata: {
    startTime: Date;
    userId: string;
    source: 'manual' | 'automatic' | 'scheduled';
  };
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  affectedRecords: number;
  executionTime: number;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  data?: any;
}

export class WorkflowExecutionService extends EventEmitter {
  private campaignService: CampaignService;
  private propertyService: PropertyService;
  private buyerService: BuyerService;
  private emailService: EmailService;
  
  constructor(
    campaignService: CampaignService,
    propertyService: PropertyService,
    buyerService: BuyerService,
    emailService: EmailService
  ) {
    super();
    this.campaignService = campaignService;
    this.propertyService = propertyService;
    this.buyerService = buyerService;
    this.emailService = emailService;
  }

  async execute(context: WorkflowExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    const logs: ExecutionLog[] = [];
    
    try {
      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Workflow execution started',
        data: { workflowId: context.workflowId }
      });

      // Step 1: Process trigger data
      const triggerResult = await this.processTrigger(context.triggerId, context.triggerData);
      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Trigger processed',
        data: triggerResult
      });

      // Step 2: Apply conditions to filter data
      const filteredData = await this.applyConditions(
        triggerResult.data,
        context.conditions
      );
      
      if (filteredData.records.length === 0) {
        logs.push({
          timestamp: new Date(),
          level: 'warning',
          message: 'No records matched conditions',
          data: { conditions: context.conditions }
        });
        
        return {
          success: true,
          affectedRecords: 0,
          executionTime: Date.now() - startTime,
          logs
        };
      }

      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `${filteredData.records.length} records matched conditions`,
        data: { recordCount: filteredData.records.length }
      });

      // Step 3: Execute action
      const actionResult = await this.executeAction(
        context.action,
        filteredData,
        context.metadata
      );

      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Action executed successfully',
        data: actionResult
      });

      // Step 4: Record execution history
      await this.recordExecution({
        workflowId: context.workflowId,
        executionTime: Date.now() - startTime,
        recordsAffected: actionResult.affectedRecords,
        status: 'completed',
        logs
      });

      return {
        success: true,
        data: actionResult.data,
        affectedRecords: actionResult.affectedRecords,
        executionTime: Date.now() - startTime,
        logs
      };

    } catch (error) {
      logs.push({
        timestamp: new Date(),
        level: 'error',
        message: 'Workflow execution failed',
        data: { error: error.message }
      });

      await this.recordExecution({
        workflowId: context.workflowId,
        executionTime: Date.now() - startTime,
        recordsAffected: 0,
        status: 'failed',
        error: error.message,
        logs
      });

      return {
        success: false,
        error: error.message,
        affectedRecords: 0,
        executionTime: Date.now() - startTime,
        logs
      };
    }
  }

  private async processTrigger(triggerId: string, triggerData: any) {
    switch (triggerId) {
      case 'property_uploaded':
        return await this.processPropertyUploadTrigger(triggerData);
      
      case 'time_based':
        return await this.processTimeBasedTrigger(triggerData);
      
      case 'property_viewed':
        return await this.processPropertyViewTrigger(triggerData);
      
      case 'property_updated':
        return await this.processPropertyUpdateTrigger(triggerData);
      
      case 'campaign_status':
        return await this.processCampaignStatusTrigger(triggerData);
      
      case 'email_tracking':
        return await this.processEmailTrackingTrigger(triggerData);
      
      case 'unsubscribe':
        return await this.processUnsubscribeTrigger(triggerData);
      
      default:
        throw new Error(`Unknown trigger: ${triggerId}`);
    }
  }

  private async applyConditions(data: any, conditions: any[]) {
    let filteredData = { ...data };
    
    for (const condition of conditions) {
      filteredData = await this.applyCondition(filteredData, condition);
    }
    
    return filteredData;
  }

  private async applyCondition(data: any, condition: any) {
    switch (condition.type) {
      case 'property_data':
        return await this.filterByPropertyData(data, condition.filters);
      
      case 'campaign_data':
        return await this.filterByCampaignData(data, condition);
      
      case 'email_tracking':
        return await this.filterByEmailTracking(data, condition);
      
      case 'email_templates':
        return await this.filterByTemplates(data, condition);
      
      case 'buyer_data':
        return await this.filterByBuyerData(data, condition);
      
      default:
        return data;
    }
  }

  private async executeAction(action: any, data: any, metadata: any) {
    switch (action.type) {
      case 'send_campaign':
        return await this.executeSendCampaign(action, data, metadata);
      
      default:
        throw new Error(`Unknown action: ${action.type}`);
    }
  }

  private async executeSendCampaign(action: any, data: any, metadata: any) {
    const campaignData = {
      name: action.campaignName || `Automated Campaign - ${new Date().toISOString()}`,
      type: action.campaignType,
      source: 'workflow',
      templateId: action.templateId,
      audienceType: 'workflow',
      segments: action.audienceSelection,
      properties: data.properties || [],
      buyers: data.buyers || [],
      scheduledDate: action.scheduledDate,
      metadata: {
        workflowId: metadata.workflowId,
        triggerData: data.triggerData
      }
    };

    if (action.campaignType === 'multi') {
      // Multi-property campaign
      const campaign = await this.campaignService.createMultiPropertyCampaign(campaignData);
      
      return {
        affectedRecords: campaignData.buyers.length,
        data: {
          campaignId: campaign.id,
          type: 'multi',
          propertyCount: campaignData.properties.length,
          recipientCount: campaignData.buyers.length
        }
      };
    } else {
      // Single property campaign
      const campaign = await this.campaignService.createCampaign(campaignData);
      
      return {
        affectedRecords: campaignData.buyers.length,
        data: {
          campaignId: campaign.id,
          type: 'single',
          propertyId: campaignData.properties[0]?.id,
          recipientCount: campaignData.buyers.length
        }
      };
    }
  }

  private async filterByPropertyData(data: any, filters: any) {
    const query: any = {};
    
    // Build MongoDB query from filters
    if (filters.area?.length) query.area = { $in: filters.area };
    if (filters.status?.length) query.status = { $in: filters.status };
    if (filters.city?.length) query.city = { $in: filters.city };
    if (filters.state?.length) query.state = { $in: filters.state };
    
    // Handle numeric filters
    ['sqft', 'acre', 'askingprice'].forEach(field => {
      if (filters[field]) {
        const filter = filters[field];
        switch (filter.operator) {
          case 'eq':
            query[field] = filter.value;
            break;
          case 'gt':
            query[field] = { $gt: filter.value };
            break;
          case 'lt':
            query[field] = { $lt: filter.value };
            break;
          case 'between':
            query[field] = { $gte: filter.value, $lte: filter.value2 };
            break;
        }
      }
    });

    // Handle date filters
    ['createdAt', 'updatedAt'].forEach(field => {
      if (filters[field]) {
        const filter = filters[field];
        switch (filter.operator) {
          case 'before':
            query[field] = { $lt: new Date(filter.value) };
            break;
          case 'after':
            query[field] = { $gt: new Date(filter.value) };
            break;
          case 'between':
            query[field] = { 
              $gte: new Date(filter.value), 
              $lte: new Date(filter.value2) 
            };
            break;
          case 'last_n_days':
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - filter.days);
            query[field] = { $gte: daysAgo };
            break;
        }
      }
    });

    const properties = await this.propertyService.find(query);
    
    return {
      ...data,
      properties,
      records: properties
    };
  }

  private async recordExecution(execution: any) {
    // Store execution history in database
    await this.db.collection('workflow_executions').insertOne({
      ...execution,
      createdAt: new Date()
    });
  }
}