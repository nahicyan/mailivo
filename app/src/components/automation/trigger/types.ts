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
  getPropertySelectionMessage(source: "trigger" | "condition" | "manual"): string;

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
  getPropertySelectionSource(): "trigger" {
    return "trigger";
  }

  showEmailSubjectToggle(): boolean {
    return true;
  }

  getDisabledConditionCategories(): string[] {
    return ["property_data"];
  }
}