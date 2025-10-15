// app/src/components/automation/trigger/types.ts

import { AutomationTrigger, AutomationCondition, AutomationAction } from "@mailivo/shared-types";

/**
 * Base interface for trigger-specific configurations
 */
export interface TriggerConfig {
  /**
   * Determines which campaign types are allowed for this trigger
   */
  getAllowedCampaignTypes(): {
    singleProperty: boolean;
    multiProperty: boolean;
  };

  /**
   * Returns the property selection source for this trigger
   */
  getPropertySelectionSource(conditions: AutomationCondition[]): "trigger" | "condition" | "manual";

  /**
   * Returns the property selection message to display
   */
  getPropertySelectionMessage(source: "trigger" | "condition" | "manual", conditions?: AutomationCondition[]): string;

  /**
   * Determines if campaign type should be locked
   */
  isCampaignTypeLocked(): boolean;

  /**
   * Returns the locked campaign type (if locked)
   */
  getLockedCampaignType(): "single_property" | "multi_property" | null;

  /**
   * Determines if email subject toggle should be shown
   */
  showEmailSubjectToggle(): boolean;

  /**
   * Returns which condition categories should be disabled
   */
  getDisabledConditionCategories(): string[];

  /**
   * Returns a description for locked campaign type (if applicable)
   */
  getLockedCampaignTypeMessage(): string | null;
}

/**
 * Factory function to get the appropriate trigger configuration
 */
export function getTriggerConfig(trigger: AutomationTrigger): TriggerConfig {
  switch (trigger.type) {
    case "property_uploaded":
      return new PropertyUploadTriggerConfig(trigger);
    case "property_viewed":
      return new PropertyViewedTriggerConfig(trigger);
    case "property_updated":
      return new PropertyUpdatedTriggerConfig(trigger);
    case "closing_date":
      return new ClosingDateTriggerConfig(trigger);
    case "time_based":
      return new TimeBasedTriggerConfig(trigger);
    default:
      return new DefaultTriggerConfig(trigger);
  }
}

/**
 * Default trigger configuration (for triggers without specific logic)
 */
class DefaultTriggerConfig implements TriggerConfig {
  constructor(protected trigger: AutomationTrigger) {}

  getAllowedCampaignTypes() {
    return { singleProperty: true, multiProperty: true };
  }

  getPropertySelectionSource(conditions: AutomationCondition[]): "trigger" | "condition" | "manual" {
    if (conditions.some((c) => c.category === "property_data")) {
      return "condition";
    }
    return "manual";
  }

  getPropertySelectionMessage(source: "trigger" | "condition" | "manual"): string {
    switch (source) {
      case "trigger":
        return "Properties will be selected from the trigger event.";
      case "condition":
        return "Properties will be filtered by the conditions you defined.";
      case "manual":
        return "You can manually select properties below.";
    }
  }

  isCampaignTypeLocked(): boolean {
    return false;
  }

  getLockedCampaignType(): "single_property" | "multi_property" | null {
    return null;
  }

  showEmailSubjectToggle(): boolean {
    return false;
  }

  getDisabledConditionCategories(): string[] {
    return [];
  }

  getLockedCampaignTypeMessage(): string | null {
    return null;
  }
}

/**
 * Property Upload trigger configuration
 */
class PropertyUploadTriggerConfig extends DefaultTriggerConfig {
  getAllowedCampaignTypes() {
    return { singleProperty: true, multiProperty: false };
  }

  getPropertySelectionSource(): "trigger" {
    return "trigger";
  }

  isCampaignTypeLocked(): boolean {
    return true;
  }

  getLockedCampaignType(): "single_property" {
    return "single_property";
  }

  showEmailSubjectToggle(): boolean {
    return true;
  }

  getDisabledConditionCategories(): string[] {
    return ["property_data"];
  }

  getLockedCampaignTypeMessage(): string {
    return "Property upload trigger requires single property campaigns.";
  }
}

/**
 * Property Viewed trigger configuration
 */
class PropertyViewedTriggerConfig extends DefaultTriggerConfig {
  getPropertySelectionSource(): "trigger" {
    return "trigger";
  }

  getDisabledConditionCategories(): string[] {
    return ["property_data"];
  }
}

/**
 * Property Updated trigger configuration
 */
class PropertyUpdatedTriggerConfig extends DefaultTriggerConfig {
  constructor(protected trigger: AutomationTrigger) {
    super(trigger);
  }

  private isDiscountUpdate(): boolean {
    const config = this.trigger.config as any;
    return config?.updateType === "discount";
  }

  getAllowedCampaignTypes() {
    // Discount updates require single property
    if (this.isDiscountUpdate()) {
      return { singleProperty: true, multiProperty: false };
    }
    // Other update types allow both
    return { singleProperty: true, multiProperty: true };
  }

  getPropertySelectionSource(): "trigger" {
    return "trigger";
  }

  isCampaignTypeLocked(): boolean {
    return this.isDiscountUpdate();
  }

  getLockedCampaignType(): "single_property" | null {
    return this.isDiscountUpdate() ? "single_property" : null;
  }

  showEmailSubjectToggle(): boolean {
    return true;
  }

  showDiscountSubjectCreator(): boolean {
    return this.isDiscountUpdate();
  }

  getDisabledConditionCategories(): string[] {
    return ["property_data"];
  }

  getLockedCampaignTypeMessage(): string | null {
    if (this.isDiscountUpdate()) {
      return "Property discount requires single property campaigns.";
    }
    return null;
  }

  getLockedTemplateType(): "single" | null {
    return this.isDiscountUpdate() ? "single" : null;
  }
}

/**
 * Time Based trigger configuration
 */
class TimeBasedTriggerConfig extends DefaultTriggerConfig {
  constructor(protected trigger: AutomationTrigger) {
    super(trigger);
  }

  getAllowedCampaignTypes() {
    return { singleProperty: false, multiProperty: true };
  }

  getPropertySelectionSource(conditions: AutomationCondition[]): "trigger" | "condition" | "manual" {
    // Always return condition for time-based triggers
    return "condition";
  }

  getPropertySelectionMessage(source: "trigger" | "condition" | "manual", conditions?: AutomationCondition[]): string {
    // Check if there are actual property conditions
    const hasPropertyConditions = conditions?.some((c) => c.category === "property_data");

    if (hasPropertyConditions) {
      return "Properties will be filtered by the conditions you defined.";
    }

    return "Add property conditions to filter which properties to include in scheduled campaigns.";
  }

  isCampaignTypeLocked(): boolean {
    return true;
  }

  getLockedCampaignType(): "multi_property" {
    return "multi_property";
  }

  showEmailSubjectToggle(): boolean {
    return false;
  }

  getDisabledConditionCategories(): string[] {
    return ["campaign_data"];
  }

  getLockedCampaignTypeMessage(): string {
    return "Time-based triggers require multi-property campaigns to aggregate properties on schedule.";
  }
}

  /**
 * Closing Date trigger configuration
 */
class ClosingDateTriggerConfig extends DefaultTriggerConfig {
  getAllowedCampaignTypes() {
    return { singleProperty: true, multiProperty: true };
  }

  getPropertySelectionSource(conditions: AutomationCondition[]): "trigger" | "condition" | "manual" {
    // If property conditions exist, properties will be filtered by those
    if (conditions.some((c) => c.category === "property_data")) {
      return "condition";
    }
    // Otherwise, it will check all properties with closing dates
    return "trigger";
  }

  getPropertySelectionMessage(source: "trigger" | "condition" | "manual", conditions?: AutomationCondition[]): string {
    switch (source) {
      case "trigger":
        return "Properties with closing dates will be automatically selected when the reminder time is reached.";
      case "condition":
        return "Properties will be filtered by your conditions and checked for upcoming closing dates.";
      case "manual":
        return "You can manually select properties with closing dates.";
    }
  }

  isCampaignTypeLocked(): boolean {
    return false;
  }

  getLockedCampaignType(): "single_property" | "multi_property" | null {
    return null;
  }

  showEmailSubjectToggle(): boolean {
    return true;
  }

  getDisabledConditionCategories(): string[] {
    return [];
  }

  getLockedCampaignTypeMessage(): string | null {
    return null;
  }
}
