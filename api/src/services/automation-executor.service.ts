// api/src/services/automation-executor.service.ts
import axios from "axios";
import { MailivoAutomation, AutomationExecution, IAutomationExecution } from "../models/MailivoAutomation";
import { Campaign } from "../models/Campaign";
import { logger } from "../utils/logger";

interface ExecutionOptions {
  testMode?: boolean;
  mockData?: any;
  dryRun?: boolean;
}

export class AutomationExecutor {
  private LANDIVO_API_URL = process.env.LANDIVO_API_URL || "https://api.landivo.com";

  /**
   * Execute an automation by ID
   */
  async executeAutomation(automationId: string, options: ExecutionOptions = {}): Promise<IAutomationExecution> {
    const automation = await MailivoAutomation.findById(automationId);

    if (!automation) {
      throw new Error(`Automation ${automationId} not found`);
    }

    if (!automation.isActive && !options.testMode) {
      throw new Error(`Automation ${automationId} is not active`);
    }

    // Create execution log
    const execution = new AutomationExecution({
      automationId: automation._id,
      userId: automation.userId,
      status: "running",
      triggeredAt: new Date(),
      triggeredBy: {
        type: automation.trigger.type,
        data: options.mockData || {},
      },
      executionLog: [],
    });

    await execution.save();

    try {
      // Step 1: Resolve trigger data
      this.log(execution, "resolve_trigger", "Resolving trigger data");
      const triggerData = await this.resolveTrigger(automation.trigger, options.mockData);

      // Step 2: Evaluate conditions
      this.log(execution, "evaluate_conditions", "Evaluating conditions");
      const conditionsPass = await this.evaluateConditions(automation.conditions, triggerData, automation.userId);

      if (!conditionsPass) {
        this.log(execution, "conditions_failed", "Conditions not met, skipping execution", "skipped");
        execution.status = "completed";
        execution.completedAt = new Date();
        await execution.save();
        return execution;
      }

      // Step 3: Resolve entities based on trigger and conditions
      this.log(execution, "resolve_entities", "Resolving entities");
      const resolvedEntities = await this.resolveEntities(automation.trigger, automation.conditions, triggerData, automation.userId);

      // Step 4: Execute action
      this.log(execution, "execute_action", "Executing action");
      const actionResult = await this.executeAction(automation.action, resolvedEntities, automation.userId, options, automationId);

      // Success
      execution.status = "completed";
      execution.completedAt = new Date();
      execution.result = actionResult;
      this.log(execution, "complete", "Automation execution completed successfully", "success");

      // Update automation stats
      await MailivoAutomation.findByIdAndUpdate(automationId, {
        $inc: { "stats.totalRuns": 1, "stats.successfulRuns": 1 },
        $set: { "stats.lastRunStatus": "success", lastRunAt: new Date() },
      });

      await execution.save();
      return execution;
    } catch (error: any) {
      logger.error(`Automation execution failed: ${automationId}`, error);

      execution.status = "failed";
      execution.error = error.message;
      execution.completedAt = new Date();
      this.log(execution, "error", error.message, "failed");

      // Update automation stats
      await MailivoAutomation.findByIdAndUpdate(automationId, {
        $inc: { "stats.totalRuns": 1, "stats.failedRuns": 1 },
        $set: { "stats.lastRunStatus": "failed", lastRunAt: new Date() },
      });

      await execution.save();
      throw error;
    }
  }

  /**
   * Resolve trigger data
   */
  private async resolveTrigger(trigger: any, mockData?: any): Promise<any> {
    if (mockData) return mockData;

    switch (trigger.type) {
      case "property_uploaded":
        return {
          propertyIds: trigger.config.propertyIds || [],
        };

      case "property_viewed":
        return {
          propertyIds: trigger.config.propertyIds || [],
          viewCount: trigger.config.viewCount,
        };

      case "property_updated":
        return {
          propertyIds: trigger.config.propertyIds || [],
          updateType: trigger.config.updateType,
        };

      case "campaign_status_changed":
        return {
          campaignIds: trigger.config.campaignIds || [],
          toStatus: trigger.config.toStatus,
        };

      case "email_tracking_status":
        return {
          campaignIds: trigger.config.campaignIds || [],
          event: trigger.config.event,
        };

      case "time_based":
        return {
          schedule: trigger.config.schedule,
          time: new Date(),
        };

      default:
        return {};
    }
  }

  /**
   * Evaluate all conditions
   */
  private async evaluateConditions(conditions: any[], triggerData: any, userId: string): Promise<boolean> {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions = always pass
    }

    for (const condition of conditions) {
      const passes = await this.evaluateCondition(condition, triggerData, userId);
      if (!passes) {
        return false; // All conditions must pass
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(condition: any, triggerData: any, userId: string): Promise<boolean> {
    const { category, conditions: filters, matchAll = true } = condition;

    let entities: any[] = [];

    // Fetch entities based on category
    switch (category) {
      case "property_data":
        entities = await this.fetchProperties(triggerData.propertyIds, userId);
        break;

      case "campaign_data":
        entities = await this.fetchCampaigns(triggerData.campaignIds, userId);
        break;

      case "buyer_data":
        entities = await this.fetchBuyers(userId);
        break;

      default:
        return true;
    }

    // Apply filters
    const results = entities.map((entity) => this.applyFilters(entity, filters, matchAll));

    // At least one entity must match
    return results.some((r) => r);
  }

  /**
   * Apply filters to an entity
   */
  private applyFilters(entity: any, filters: any[], matchAll: boolean): boolean {
    const results = filters.map((filter) => {
      const value = entity[filter.field];
      return this.compareValues(value, filter.operator, filter.value, filter.secondValue);
    });

    return matchAll ? results.every((r) => r) : results.some((r) => r);
  }

  /**
   * Compare values based on operator
   */
  private compareValues(entityValue: any, operator: string, filterValue: any, secondValue?: any): boolean {
    switch (operator) {
      case "equals":
        return entityValue == filterValue;

      case "not_equals":
        return entityValue != filterValue;

      case "greater_than":
        return Number(entityValue) > Number(filterValue);

      case "less_than":
        return Number(entityValue) < Number(filterValue);

      case "between":
        return Number(entityValue) >= Number(filterValue) && Number(entityValue) <= Number(secondValue);

      case "in":
        return Array.isArray(filterValue) && filterValue.includes(entityValue);

      case "not_in":
        return Array.isArray(filterValue) && !filterValue.includes(entityValue);

      case "contains":
        return String(entityValue).toLowerCase().includes(String(filterValue).toLowerCase());

      case "not_contains":
        return !String(entityValue).toLowerCase().includes(String(filterValue).toLowerCase());

      // Date operators
      case "before":
        return new Date(entityValue) < new Date(filterValue);

      case "after":
        return new Date(entityValue) > new Date(filterValue);

      case "on":
        const date1 = new Date(entityValue).toDateString();
        const date2 = new Date(filterValue).toDateString();
        return date1 === date2;

      default:
        return false;
    }
  }

  /**
   * Resolve entities from trigger and conditions
   */
  private async resolveEntities(trigger: any, conditions: any[], triggerData: any, userId: string): Promise<any> {
    const entities: any = {
      properties: [],
      campaigns: [],
      buyers: [],
    };

    // Resolve properties
    if (this.triggerSelectsProperty(trigger.type)) {
      entities.properties = await this.fetchProperties(triggerData.propertyIds, userId);
    } else if (conditions.some((c) => c.category === "property_data")) {
      entities.properties = await this.fetchAndFilterProperties(conditions, userId);
    }

    // Resolve campaigns
    if (this.triggerSelectsCampaign(trigger.type)) {
      entities.campaigns = await this.fetchCampaigns(triggerData.campaignIds, userId);
    }

    // Resolve buyers
    if (conditions.some((c) => c.category === "buyer_data")) {
      entities.buyers = await this.fetchAndFilterBuyers(conditions, userId);
    }

    return entities;
  }

  /**
   * Execute the automation action
   */
  private async executeAction(action: any, resolvedEntities: any, _userId: string, options: ExecutionOptions, automationId: string): Promise<any> {
    if (action.type !== "send_campaign") {
      throw new Error(`Unknown action type: ${action.type}`);
    }

    const config = action.config;

    // Determine properties for campaign
    let propertyIds: string[] = [];

    if (config.propertySelection.source === "manual") {
      propertyIds = config.propertySelection.propertyIds || [];
    } else if (config.propertySelection.source === "trigger" || config.propertySelection.source === "condition") {
      propertyIds = resolvedEntities.properties.map((p: any) => p._id || p.id);
    }

    if (propertyIds.length === 0) {
      throw new Error("No properties selected for campaign");
    }

    // Increment counter and fetch property data for variable replacement
    const automation = await MailivoAutomation.findById(automationId);
    if (!automation) {
      throw new Error(`Automation ${automationId} not found`);
    }
    const currentCounter = ((automation.action.config as any).campaignCounter || 0) + 1;
    await MailivoAutomation.findByIdAndUpdate(automationId, {
      "action.config.campaignCounter": currentCounter,
    });

    // Fetch property data for variables
    const propertyData = propertyIds[0] ? await this.fetchPropertyData(propertyIds[0]) : {};

    // Replace variables in name and subject
    const campaignName = this.replaceVariables(config.name, propertyData, currentCounter);
    const campaignSubject = this.replaceVariables(config.subject, propertyData, currentCounter);

    // Build campaign data
    const campaignData = {
      name: campaignName,
      subject: config.subject === "bypass" ? "bypass" : campaignSubject,
      description: config.description,
      type: config.campaignType,
      property: config.campaignType === "single_property" ? propertyIds[0] : propertyIds,
      emailList: config.emailList, // Now handles Match-Title, Match-Area, or list ID
      emailTemplate: config.emailTemplate,
      selectedAgent: config.selectedAgent,
      emailSchedule: config.schedule === "immediate" ? "immediate" : "scheduled",
      scheduledDate: config.scheduledDate,
      emailVolume: resolvedEntities.buyers?.length || 0,
      source: "landivo",
      status: config.schedule === "immediate" ? "active" : "draft",
      imageSelections: config.imageSelections,

      // Add payment plan data
      financingEnabled: config.campaignType === "single_property" ? config.financingEnabled : config.multiPropertyConfig?.financingEnabled,
      planStrategy: config.campaignType === "single_property" ? config.planStrategy : config.multiPropertyConfig?.planStrategy,

      multiPropertyMeta:
        config.campaignType === "multi_property"
          ? {
              sortStrategy: config.multiPropertyConfig?.sortStrategy,
              maxProperties: config.multiPropertyConfig?.maxProperties,
              // ... existing multiPropertyConfig fields ...
            }
          : undefined,
    };

    // Create campaign
    if (options.dryRun || options.testMode) {
      logger.info("[TEST MODE] Would create campaign:", campaignData);
      return {
        campaignId: "test-campaign-id",
        recipientCount: campaignData.emailVolume,
        status: "test",
      };
    }

    const campaign = new Campaign(campaignData);
    await campaign.save();

    // If immediate, send campaign
    if (config.schedule === "immediate") {
      // Trigger campaign send (existing send logic)
      // This would call your existing campaign send service
    }

    return {
      campaignId: campaign.id.toString(),
      recipientCount: campaign.emailVolume,
      status: campaign.status,
    };
  }

  // Helper methods
  private async fetchProperties(propertyIds: string[], userId: string): Promise<any[]> {
    try {
      if (!propertyIds || propertyIds.length === 0) {
        const response = await axios.get(`${this.LANDIVO_API_URL}/residency`, {
          params: { userId },
        });
        return response.data;
      }

      const properties = await Promise.all(
        propertyIds.map((id) =>
          axios
            .get(`${this.LANDIVO_API_URL}/residency/${id}`)
            .then((res) => res.data)
            .catch((err) => {
              logger.error(`Failed to fetch property ${id}:`, err);
              return null;
            })
        )
      );

      return properties.filter(Boolean);
    } catch (error) {
      logger.error("Failed to fetch properties:", error);
      return [];
    }
  }

  private async fetchAndFilterProperties(conditions: any[], _userId: string): Promise<any[]> {
    const allProperties = await this.fetchProperties([], _userId);

    const propertyConditions = conditions.filter((c) => c.category === "property_data");

    return allProperties.filter((property) => {
      return propertyConditions.every((condition) => this.applyFilters(property, condition.conditions, condition.matchAll ?? true));
    });
  }

  private async fetchCampaigns(campaignIds: string[], userId: string): Promise<any[]> {
    try {
      if (!campaignIds || campaignIds.length === 0) {
        return await Campaign.find({ userId }).lean();
      }

      return await Campaign.find({ _id: { $in: campaignIds }, userId }).lean();
    } catch (error) {
      logger.error("Failed to fetch campaigns:", error);
      return [];
    }
  }

  private async fetchBuyers(userId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.LANDIVO_API_URL}/buyer`, {
        params: { userId },
      });
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch buyers:", error);
      return [];
    }
  }

  private async fetchAndFilterBuyers(conditions: any[], userId: string): Promise<any[]> {
    const allBuyers = await this.fetchBuyers(userId);

    const buyerConditions = conditions.filter((c) => c.category === "buyer_data");

    return allBuyers.filter((buyer) => {
      return buyerConditions.every((condition) => this.applyFilters(buyer, condition.conditions, condition.matchAll ?? true));
    });
  }

  private triggerSelectsProperty(triggerType: string): boolean {
    return ["property_uploaded", "property_viewed", "property_updated"].includes(triggerType);
  }

  private triggerSelectsCampaign(triggerType: string): boolean {
    return ["campaign_status_changed", "email_tracking_status"].includes(triggerType);
  }

  private log(execution: IAutomationExecution, step: string, message: string, status: "success" | "failed" | "skipped" = "success") {
    execution.executionLog.push({
      step,
      timestamp: new Date(),
      status,
      message,
    });
  }
  /**
   * Replace variables in template strings
   */
  private replaceVariables(template: string, propertyData: any, counter: number): string {
    let result = template;

    const vars: Record<string, any> = {
      title: propertyData.title || "",
      streetAddress: propertyData.streetAddress || "",
      city: propertyData.city || "",
      county: propertyData.county || "",
      state: propertyData.state || "",
      zip: propertyData.zip || "",
    };

    Object.keys(vars).forEach((key) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      result = result.replace(regex, vars[key]);
    });

    // Replace counter variable
    result = result.replace(/\{#\}/g, counter.toString());

    return result;
  }

  /**
   * Fetch property data from Landivo API
   */
  private async fetchPropertyData(propertyId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.LANDIVO_API_URL}/residency/${propertyId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch property data: ${propertyId}`, error);
      return {};
    }
  }
}
