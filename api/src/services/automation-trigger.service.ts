// api/src/services/automation-trigger.service.ts
import { MailivoAutomation } from '../models/MailivoAutomation';
import { AutomationExecution } from '../models/AutomationExecution';
import { automationMatcherService } from './automation-matcher.service';
import { campaignCreatorService } from './campaign-creator.service';
import { logger } from '../utils/logger';

interface TriggerPayload {
  type: 'property_uploaded' | 'property_updated' | 'property_viewed' | 'campaign_status_changed' | 'email_tracking_status';
  data: any;
  source: string;
}

interface ProcessResult {
  executionsTriggered: number;
  automationsMatched: number;
  executionIds: string[];
}

class AutomationTriggerService {
  /**
   * Main entry point for processing automation triggers
   */
  async processTrigger(payload: TriggerPayload): Promise<ProcessResult> {
    const { type, data, source } = payload;

    logger.info('Processing trigger', { type, source });

    try {
      // 1. Validate and normalize incoming data
      const normalizedData = this.normalizeIncomingData(type, data);

      // 2. Find all active automations matching this trigger type
      const automations = await this.findMatchingAutomations(type);

      logger.info(`Found ${automations.length} automations for trigger type: ${type}`);

      if (automations.length === 0) {
        return {
          executionsTriggered: 0,
          automationsMatched: 0,
          executionIds: []
        };
      }

      // 3. For each automation, check if it matches the incoming data
      const matchResults = await Promise.all(
        automations.map(automation => 
          automationMatcherService.evaluateAutomation(automation, normalizedData)
        )
      );

      // 4. Execute matching automations
      const executionIds: string[] = [];
      let successCount = 0;

      for (let i = 0; i < automations.length; i++) {
        const automation = automations[i];
        const matches = matchResults[i];

        if (matches) {
          try {
            const executionId = await this.executeAutomation(automation, normalizedData);
            executionIds.push(executionId);
            successCount++;
          } catch (error: any) {
            logger.error(`Failed to execute automation ${automation._id}`, { error: error.message });
          }
        }
      }

      logger.info(`Triggered ${successCount} automations successfully`);

      return {
        executionsTriggered: successCount,
        automationsMatched: matchResults.filter(Boolean).length,
        executionIds
      };

    } catch (error: any) {
      logger.error('Trigger processing failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Normalize incoming data based on trigger type
   */
  private normalizeIncomingData(type: string, data: any): any {
    switch (type) {
      case 'property_uploaded':
        return {
          propertyIds: data.propertyID ? [data.propertyID] : [],
          propertyData: data,
          timestamp: new Date()
        };

      case 'property_updated':
        return {
          propertyIds: data.propertyID ? [data.propertyID] : [],
          propertyData: data,
          updateType: data.updateType || 'general',
          timestamp: new Date()
        };

      case 'property_viewed':
        return {
          propertyIds: data.propertyID ? [data.propertyID] : [],
          viewerId: data.userId,
          viewCount: data.viewCount || 1,
          timestamp: new Date()
        };

      case 'campaign_status_changed':
        return {
          campaignId: data.campaignId,
          fromStatus: data.fromStatus,
          toStatus: data.toStatus,
          timestamp: new Date()
        };

      case 'email_tracking_status':
        return {
          campaignId: data.campaignId,
          contactId: data.contactId,
          event: data.event,
          timestamp: new Date()
        };

      default:
        return data;
    }
  }

  /**
   * Find all active automations for a trigger type
   */
  private async findMatchingAutomations(triggerType: string): Promise<any[]> {
    return await MailivoAutomation.find({
      'trigger.type': triggerType,
      isActive: true
    }).lean();
  }

  /**
   * Execute a single automation
   */
  private async executeAutomation(automation: any, triggerData: any): Promise<string> {
    // Create execution record
    const execution = new AutomationExecution({
      automationId: automation._id,
      userId: automation.userId,
      status: 'pending',
      triggeredAt: new Date(),
      triggeredBy: {
        type: automation.trigger.type,
        data: triggerData
      },
      executionLog: []
    });

    await execution.save();

    try {
      // Update execution status
      execution.status = 'running';
      execution.executionLog.push({
        step: 'trigger_received',
        timestamp: new Date(),
        status: 'success',
        message: 'Automation triggered successfully'
      });
      await execution.save();

      // Create campaign using the campaign creator service
      const campaignResult = await campaignCreatorService.createCampaignFromAutomation(
        automation,
        triggerData,
        execution.id.toString()
      );

      // Update execution with success
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.result = {
        campaignId: campaignResult.campaignId,
        recipientCount: campaignResult.recipientCount,
        status: 'success'
      };
      execution.executionLog.push({
        step: 'campaign_created',
        timestamp: new Date(),
        status: 'success',
        message: `Campaign ${campaignResult.campaignId} created successfully`,
        data: { campaignId: campaignResult.campaignId }
      });

      await execution.save();

      // Update automation stats
      await MailivoAutomation.findByIdAndUpdate(automation._id, {
        $inc: { 'stats.totalRuns': 1, 'stats.successfulRuns': 1 },
        lastRunAt: new Date(),
        'stats.lastRunStatus': 'success'
      });

      logger.info(`Automation executed successfully`, {
        automationId: automation._id,
        executionId: execution._id,
        campaignId: campaignResult.campaignId
      });

      return execution.id.toString();

    } catch (error: any) {
      // Update execution with failure
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.error = error.message;
      execution.executionLog.push({
        step: 'execution_failed',
        timestamp: new Date(),
        status: 'failed',
        message: error.message
      });

      await execution.save();

      // Update automation stats
      await MailivoAutomation.findByIdAndUpdate(automation._id, {
        $inc: { 'stats.totalRuns': 1, 'stats.failedRuns': 1 },
        lastRunAt: new Date(),
        'stats.lastRunStatus': 'failed'
      });

      throw error;
    }
  }
}

export const automationTriggerService = new AutomationTriggerService();