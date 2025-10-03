// lib/automation-validation.ts
// Comprehensive validation logic for Mailivo automations

import { Automation, AutomationTrigger, AutomationCondition, AutomationAction, ValidationResult, ValidationError, ValidationWarning, EntitySelectionState } from "@mailivo/shared-types";

export class AutomationValidator {
  /**
   * Main validation entry point
   */
  static validateAutomation(automation: Partial<Automation>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic structure validation
    if (!automation.name?.trim()) {
      errors.push({
        code: "MISSING_NAME",
        message: "Automation name is required",
        field: "name",
        severity: "error",
      });
    }

    if (!automation.trigger) {
      errors.push({
        code: "MISSING_TRIGGER",
        message: "Automation must have exactly one trigger",
        field: "trigger",
        severity: "error",
      });
      return { isValid: false, errors, warnings };
    }

    if (!automation.action) {
      errors.push({
        code: "MISSING_ACTION",
        message: "Automation must have an action",
        field: "action",
        severity: "error",
      });
      return { isValid: false, errors, warnings };
    }

    // Track entity selections across trigger, conditions, and action
    const entityState = this.buildEntitySelectionState(automation.trigger, automation.conditions || [], automation.action);

    // Validate entity selection conflicts
    const entityErrors = this.validateEntitySelections(entityState, automation);
    errors.push(...entityErrors);

    // Validate trigger configuration
    const triggerErrors = this.validateTrigger(automation.trigger);
    errors.push(...triggerErrors);

    // Validate conditions
    if (automation.conditions) {
      for (const condition of automation.conditions) {
        const conditionErrors = this.validateCondition(condition, entityState);
        errors.push(...conditionErrors);
      }
    }

    // Validate action
    const actionErrors = this.validateAction(automation.action, entityState, automation.trigger);
    errors.push(...actionErrors);

    // Generate warnings for best practices
    const bestPracticeWarnings = this.generateBestPracticeWarnings(automation, entityState);
    warnings.push(...bestPracticeWarnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Build entity selection state to track which entities are selected where
   */
  private static buildEntitySelectionState(trigger: AutomationTrigger, conditions: AutomationCondition[], action: AutomationAction): EntitySelectionState {
    const state: EntitySelectionState = {
      property: { selected: false },
      campaign: { selected: false },
      buyer: { selected: false },
      template: { selected: false },
    };

    // Check trigger
    if (this.triggerSelectsProperty(trigger)) {
      state.property = {
        selected: true,
        source: "trigger",
        ids: this.getPropertyIdsFromTrigger(trigger),
      };
    }

    if (this.triggerSelectsCampaign(trigger)) {
      state.campaign = {
        selected: true,
        source: "trigger",
        ids: this.getCampaignIdsFromTrigger(trigger),
      };
    }

    // Check conditions
    for (const condition of conditions) {
      if (condition.category === "property_data") {
        if (!state.property.selected) {
          state.property = {
            selected: true,
            source: "condition",
          };
        }
      }

      if (condition.category === "campaign_data") {
        if (!state.campaign.selected) {
          state.campaign = {
            selected: true,
            source: "condition",
          };
        }
      }

      if (condition.category === "buyer_data") {
        if (!state.buyer.selected) {
          state.buyer = {
            selected: true,
            source: "condition",
          };
        }
      }

      if (condition.category === "email_template") {
        if (!state.template.selected) {
          state.template = {
            selected: true,
            source: "condition",
          };
        }
      }
    }

    // Check action
    if (action.type === "send_campaign") {
      // Action will select template
      if (!state.template.selected) {
        state.template = {
          selected: true,
          source: "action",
          id: action.config.emailTemplate,
        };
      }

      // Check if action tries to manually select properties
      if (action.config.propertySelection.source === "manual" && action.config.propertySelection.propertyIds?.length) {
        if (!state.property.selected) {
          state.property = {
            selected: true,
            source: "action",
            ids: action.config.propertySelection.propertyIds,
          };
        }
      }
    }

    return state;
  }

  /**
   * Validate entity selection conflicts
   */
  private static validateEntitySelections(state: EntitySelectionState, automation: Partial<Automation>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Property validation
    if (state.property.selected) {
      const trigger = automation.trigger!;
      const action = automation.action!;

      // If trigger selects property, conditions cannot filter properties
      if (state.property.source === "trigger") {
        const hasPropertyCondition = automation.conditions?.some((c) => c.category === "property_data");

        if (hasPropertyCondition) {
          errors.push({
            code: "DUPLICATE_PROPERTY_SELECTION",
            message: "Property is already selected by trigger. Remove property conditions or change trigger type.",
            field: "conditions",
            severity: "error",
          });
        }

        // If trigger selects specific properties, action cannot select different ones
        if (action.type === "send_campaign" && action.config.propertySelection.source === "manual") {
          errors.push({
            code: "CONFLICTING_PROPERTY_SELECTION",
            message: 'Property is already selected by trigger. Set action property selection to "trigger".',
            field: "action.config.propertySelection",
            severity: "error",
          });
        }
      }

      // If condition selects property, action must use condition source
      if (state.property.source === "condition") {
        if (action.type === "send_campaign" && action.config.propertySelection.source === "manual") {
          errors.push({
            code: "CONFLICTING_PROPERTY_SELECTION",
            message: 'Property is filtered by conditions. Set action property selection to "condition".',
            field: "action.config.propertySelection",
            severity: "error",
          });
        }
      }

      // For multi-property campaigns with time triggers, properties must come from conditions
      if (trigger.type === "time_based" && action.type === "send_campaign" && action.config.campaignType === "multi_property") {
        if (!automation.conditions?.some((c) => c.category === "property_data")) {
          errors.push({
            code: "MISSING_PROPERTY_FILTER",
            message: "Multi-property campaigns with time triggers require property conditions to select properties.",
            field: "conditions",
            severity: "error",
          });
        }
      }
    }

    // Campaign validation
    if (state.campaign.selected && state.campaign.source !== "trigger") {
      errors.push({
        code: "INVALID_CAMPAIGN_CONDITION",
        message: "Campaign conditions can only be used with campaign-related triggers.",
        field: "conditions",
        severity: "error",
      });
    }

    // Template validation
    if (state.template.source === "condition") {
      // Template conditions are OK, they filter which template to use
      // But we need to ensure action template matches condition
      const action = automation.action as AutomationAction;
      if (action.type === "send_campaign" && !action.config.emailTemplate) {
        errors.push({
          code: "MISSING_TEMPLATE",
          message: "Template must be selected in action configuration.",
          field: "action.config.emailTemplate",
          severity: "error",
        });
      }
    }

    return errors;
  }

  /**
   * Validate trigger configuration
   */
  private static validateTrigger(trigger: AutomationTrigger): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (trigger.type) {
      case "time_based":
        if (!trigger.config.schedule) {
          errors.push({
            code: "INVALID_TIME_TRIGGER",
            message: "Time-based trigger requires a schedule configuration.",
            field: "trigger.config.schedule",
            severity: "error",
          });
        }

        if (trigger.config.schedule === "specific_date" && !trigger.config.specificDate) {
          errors.push({
            code: "MISSING_SPECIFIC_DATE",
            message: "Specific date is required for this schedule type.",
            field: "trigger.config.specificDate",
            severity: "error",
          });
        }
        break;

      case "property_viewed":
        if (!trigger.config.requireLoggedIn) {
          errors.push({
            code: "INVALID_PROPERTY_VIEW_TRACKING",
            message: "Property viewed trigger requires logged-in users for accurate tracking.",
            field: "trigger.config.requireLoggedIn",
            severity: "error",
          });
        }
        break;

      case "email_tracking_status":
        if (!trigger.config.event) {
          errors.push({
            code: "MISSING_TRACKING_EVENT",
            message: "Email tracking trigger requires an event type.",
            field: "trigger.config.event",
            severity: "error",
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Validate condition configuration
   */
  private static validateCondition(condition: AutomationCondition, _state: EntitySelectionState): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!condition.conditions || condition.conditions.length === 0) {
      errors.push({
        code: "EMPTY_CONDITION",
        message: `${condition.category} condition has no filters defined.`,
        field: "conditions",
        severity: "error",
      });
      return errors;
    }

    // Validate each filter
    for (const filter of condition.conditions) {
      if (!filter.field) {
        errors.push({
          code: "MISSING_CONDITION_FIELD",
          message: "Condition filter must specify a field.",
          field: `conditions.${condition.category}`,
          severity: "error",
        });
      }

      if (!filter.operator) {
        errors.push({
          code: "MISSING_CONDITION_OPERATOR",
          message: "Condition filter must specify an operator.",
          field: `conditions.${condition.category}`,
          severity: "error",
        });
      }

      if (filter.value === undefined || filter.value === null) {
        errors.push({
          code: "MISSING_CONDITION_VALUE",
          message: `Condition filter for ${filter.field} must have a value.`,
          field: `conditions.${condition.category}.${filter.field}`,
          severity: "error",
        });
      }

      // Validate 'between' operator has secondValue
      if (filter.operator === "between" && "secondValue" in filter && !filter.secondValue) {
        errors.push({
          code: "MISSING_SECOND_VALUE",
          message: `Between operator requires a second value for ${filter.field}.`,
          field: `conditions.${condition.category}.${filter.field}`,
          severity: "error",
        });
      }
    }

    return errors;
  }

  /**
   * Validate action configuration
   */
  // FIND the validateAction method that ends incomplete around line 409
  // It should look like:
  private static validateAction(
    action: AutomationAction,
    state: EntitySelectionState,
    trigger: AutomationTrigger // This parameter was added
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (action.type !== "send_campaign") {
      return errors;
    }

    const config = action.config;

    // Validate required fields
    if (!config.name?.trim()) {
      errors.push({
        code: "MISSING_CAMPAIGN_NAME",
        message: "Campaign name is required.",
        field: "action.config.name",
        severity: "error",
      });
    }

    // ADD THIS NEW CODE HERE (after the name validation):

    // Validate email subject for property triggers
    if (trigger.type === "property_uploaded" || trigger.type === "property_updated") {
      if (config.subject !== "bypass" && !config.subject?.trim()) {
        errors.push({
          code: "MISSING_CAMPAIGN_SUBJECT",
          message: "Campaign subject is required or must be set to bypass.",
          field: "action.config.subject",
          severity: "error",
        });
      }
    } else {
      // For other triggers, subject is always required
      if (!config.subject?.trim()) {
        errors.push({
          code: "MISSING_CAMPAIGN_SUBJECT",
          message: "Campaign subject is required.",
          field: "action.config.subject",
          severity: "error",
        });
      }
    }

    // Validate email list
    if (!config.emailList) {
      errors.push({
        code: "MISSING_EMAIL_LIST",
        message: "Email list is required.",
        field: "action.config.emailList",
        severity: "error",
      });
    }

    // Validate Match-* email lists
    if (config.emailList?.startsWith("Match-")) {
      if (!["Match-Title", "Match-Area"].includes(config.emailList)) {
        errors.push({
          code: "INVALID_MATCH_LIST",
          message: "Invalid match list type. Must be Match-Title or Match-Area.",
          field: "action.config.emailList",
          severity: "error",
        });
      }
    }

    if (!config.emailTemplate) {
      errors.push({
        code: "MISSING_EMAIL_TEMPLATE",
        message: "Email template is required.",
        field: "action.config.emailTemplate",
        severity: "error",
      });
    }

    // Validate property selection logic
    if (!state.property.selected && config.campaignType === "single_property") {
      errors.push({
        code: "NO_PROPERTY_SOURCE",
        message: "Single property campaign requires a property source (trigger, condition, or manual selection).",
        field: "action.config.propertySelection",
        severity: "error",
      });
    }

    if (config.propertySelection.source === "manual" && (!config.propertySelection.propertyIds || config.propertySelection.propertyIds.length === 0)) {
      errors.push({
        code: "MISSING_MANUAL_PROPERTIES",
        message: "Manual property selection requires at least one property ID.",
        field: "action.config.propertySelection.propertyIds",
        severity: "error",
      });
    }

    // Validate scheduling
    if (config.schedule === "scheduled" && !config.scheduledDate) {
      errors.push({
        code: "MISSING_SCHEDULED_DATE",
        message: "Scheduled campaigns require a date.",
        field: "action.config.scheduledDate",
        severity: "error",
      });
    }

    if (config.schedule === "time_delay" && !config.delay) {
      errors.push({
        code: "MISSING_DELAY_CONFIG",
        message: "Time delay scheduling requires delay configuration.",
        field: "action.config.delay",
        severity: "error",
      });
    }

    // Validate multi-property specific configs
    if (config.campaignType === "multi_property") {
      if (!config.multiPropertyConfig) {
        errors.push({
          code: "MISSING_MULTI_PROPERTY_CONFIG",
          message: "Multi-property campaigns require multiPropertyConfig.",
          field: "action.config.multiPropertyConfig",
          severity: "error",
        });
      }
    }

    return errors;
  }

  /**
   * Generate best practice warnings
   */
  private static generateBestPracticeWarnings(automation: Partial<Automation>, _state: EntitySelectionState): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Warn if no conditions are used
    if (!automation.conditions || automation.conditions.length === 0) {
      warnings.push({
        code: "NO_CONDITIONS",
        message: "Consider adding conditions to filter recipients or properties.",
        severity: "warning",
      });
    }

    // Warn about time-based triggers without proper conditions
    if (automation.trigger?.type === "time_based" && automation.action?.type === "send_campaign") {
      const hasRecipientFilter = automation.conditions?.some((c) => c.category === "buyer_data");

      if (!hasRecipientFilter) {
        warnings.push({
          code: "NO_RECIPIENT_FILTER",
          message: "Time-based automations should filter recipients to avoid sending to all contacts.",
          severity: "warning",
        });
      }
    }

    // Warn about property uploaded trigger without conditions
    if (automation.trigger?.type === "property_uploaded") {
      const hasPropertyFilter = automation.conditions?.some((c) => c.category === "property_data");

      if (!hasPropertyFilter) {
        warnings.push({
          code: "NO_PROPERTY_FILTER",
          message: "Consider filtering properties by criteria to avoid sending campaigns for all new uploads.",
          severity: "warning",
        });
      }
    }

    return warnings;
  }

  // Helper methods
  private static triggerSelectsProperty(trigger: AutomationTrigger): boolean {
    return ["property_uploaded", "property_viewed", "property_updated"].includes(trigger.type);
  }

  private static triggerSelectsCampaign(trigger: AutomationTrigger): boolean {
    return ["campaign_status_changed", "email_tracking_status"].includes(trigger.type);
  }

  private static getPropertyIdsFromTrigger(trigger: AutomationTrigger): string[] | undefined {
    if (trigger.type === "property_uploaded") {
      return trigger.config.propertyIds;
    }
    if (trigger.type === "property_viewed") {
      return trigger.config.propertyIds;
    }
    if (trigger.type === "property_updated") {
      return trigger.config.propertyIds;
    }
    return undefined;
  }

  private static getCampaignIdsFromTrigger(trigger: AutomationTrigger): string[] | undefined {
    if (trigger.type === "campaign_status_changed") {
      return trigger.config.campaignIds;
    }
    if (trigger.type === "email_tracking_status") {
      return trigger.config.campaignIds;
    }
    return undefined;
  }
}
