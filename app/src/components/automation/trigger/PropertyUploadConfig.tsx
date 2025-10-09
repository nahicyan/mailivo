// app/src/components/automation/trigger/PropertyUploadConfig.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTriggerConfig } from "./types";
import { AutomationTrigger, AutomationCondition, AutomationAction } from "@mailivo/shared-types";

/**
 * Template interface matching the system
 */
interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  type?: "single" | "multi";
  components?: any[];
  thumbnail?: string;
}

/**
 * HOOKS
 */

/**
 * Main hook for trigger-specific configuration
 * Use this in ActionConfigurator
 */
export function useTriggerConfiguration(trigger: AutomationTrigger, conditions: AutomationCondition[], value?: AutomationAction) {
  const triggerConfig = getTriggerConfig(trigger);
  const propertySelectionSource = triggerConfig.getPropertySelectionSource(conditions);

  return {
    // Property selection
    propertySelectionSource,
    canSelectManualProperties: propertySelectionSource === "manual",
    propertyMessage: triggerConfig.getPropertySelectionMessage(propertySelectionSource),

    // Campaign type
    isCampaignTypeLocked: triggerConfig.isCampaignTypeLocked(),
    lockedCampaignType: triggerConfig.getLockedCampaignType(),
    lockedCampaignTypeMessage: triggerConfig.getLockedCampaignTypeMessage(),
    allowedCampaignTypes: triggerConfig.getAllowedCampaignTypes(),

    // UI toggles
    showEmailSubjectToggle: triggerConfig.showEmailSubjectToggle(),

    // Conditions
    disabledConditionCategories: triggerConfig.getDisabledConditionCategories(),
  };
}

/**
 * Hook for filtering templates based on campaign type
 * Property upload triggers lock to single property, so only single templates should show
 */
export function useFilteredTemplates(templates: EmailTemplate[], campaignType: "single_property" | "multi_property"): EmailTemplate[] {
  return useMemo(() => {
    if (!templates || templates.length === 0) return [];

    // Filter templates based on campaign type
    const templateType = campaignType === "single_property" ? "single" : "multi";
    return templates.filter((t) => t.type === templateType || !t.type); // Include templates without type for backward compatibility
  }, [templates, campaignType]);
}

/**
 * Hook for managing email subject toggle state
 * Specific to property upload/update triggers
 */
export function useEmailSubjectToggle(initialValue?: string) {
  const [useFromLandivo, setUseFromLandivo] = useState(initialValue === "bypass");

  const handleToggleChange = (useLandivo: boolean, updateConfig: (updates: any) => void) => {
    setUseFromLandivo(useLandivo);
    updateConfig({ subject: useLandivo ? "bypass" : "" });
  };

  return {
    useFromLandivo,
    setUseFromLandivo,
    handleToggleChange,
  };
}

/**
 * Hook for initializing default action config
 */
export function useDefaultActionConfig(trigger: AutomationTrigger, conditions: AutomationCondition[], value: AutomationAction | undefined, onChange: (action: AutomationAction) => void) {
  const triggerConfig = getTriggerConfig(trigger);

  useEffect(() => {
    if (!value) {
      const propertySelectionSource = triggerConfig.getPropertySelectionSource(conditions);
      const lockedCampaignType = triggerConfig.getLockedCampaignType();

      onChange({
        type: "send_campaign",
        config: {
          campaignType: lockedCampaignType || "single_property",
          propertySelection: {
            source: propertySelectionSource,
            propertyIds: [],
          },
          emailList: "",
          emailTemplate: "",
          schedule: "immediate",
          name: "",
          subject: "",
        },
      });
    }
  }, []); // Only run once on mount
}

/**
 * Hook for ConditionBuilder to get disabled categories
 */
export function useDisabledCategories(trigger: AutomationTrigger): string[] {
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);

  useEffect(() => {
    const disabled: string[] = [];

    // Property-selecting triggers disable property_data conditions
    if (["property_uploaded", "property_viewed", "property_updated"].includes(trigger.type)) {
      disabled.push("property_data");
    }

    // Only campaign triggers can use campaign_data conditions
    if (!["campaign_status_changed", "email_tracking_status"].includes(trigger.type)) {
      disabled.push("campaign_data");
    }

    setDisabledCategories(disabled);
  }, [trigger.type]);

  return disabledCategories;
}


/**
 * UTILITY FUNCTIONS
 */

/**
 * Check if trigger is a property-related trigger
 */
export function isPropertyTrigger(triggerType: string): boolean {
  return ["property_uploaded", "property_viewed", "property_updated"].includes(triggerType);
}

/**
 * Check if trigger is a campaign-related trigger
 */
export function isCampaignTrigger(triggerType: string): boolean {
  return ["campaign_status_changed", "email_tracking_status"].includes(triggerType);
}

/**
 * Get disabled condition categories for a trigger
 */
export function getDisabledCategoriesForTrigger(trigger: AutomationTrigger): string[] {
  const triggerConfig = getTriggerConfig(trigger);
  return triggerConfig.getDisabledConditionCategories();
}

/**
 * Check if a condition category should be disabled
 */
export function isCategoryDisabled(category: string, trigger: AutomationTrigger): boolean {
  const disabled = getDisabledCategoriesForTrigger(trigger);
  return disabled.includes(category);
}

/**
 * Validate if property conditions are allowed for this trigger
 */
export function canHavePropertyConditions(trigger: AutomationTrigger): boolean {
  return !isPropertyTrigger(trigger.type);
}

/**
 * Validate if campaign conditions are allowed for this trigger
 */
export function canHaveCampaignConditions(trigger: AutomationTrigger): boolean {
  return isCampaignTrigger(trigger.type);
}

/**
 * Filter templates based on campaign type
 * Single property campaigns should only show single templates
 * Multi property campaigns should only show multi templates
 */
export function filterTemplatesByCampaignType(templates: EmailTemplate[], campaignType: "single_property" | "multi_property"): EmailTemplate[] {
  if (!templates || templates.length === 0) return [];

  const templateType = campaignType === "single_property" ? "single" : "multi";
  return templates.filter((t) => t.type === templateType || !t.type);
}

/**
 * Get the required template type for a campaign type
 */
export function getRequiredTemplateType(campaignType: "single_property" | "multi_property"): "single" | "multi" {
  return campaignType === "single_property" ? "single" : "multi";
}

/**
 * COMPONENTS
 */

interface PropertyUploadConfigProps {
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
}

/**
 * Property selection alert component
 */
export function PropertySelectionAlert({ trigger, conditions }: PropertyUploadConfigProps) {
  const triggerConfig = getTriggerConfig(trigger);
  const source = triggerConfig.getPropertySelectionSource(conditions);
  const message = triggerConfig.getPropertySelectionMessage(source);

  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="font-medium mb-1">Property Selection</div>
        <p className="text-sm">{message}</p>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Locked campaign type alert component
 */
export function LockedCampaignTypeAlert({ trigger }: { trigger: AutomationTrigger }) {
  const triggerConfig = getTriggerConfig(trigger);

  if (!triggerConfig.isCampaignTypeLocked()) {
    return null;
  }

  const message = triggerConfig.getLockedCampaignTypeMessage();

  return (
    <div className="mt-1">
      <Alert className="bg-blue-50 border-blue-200">
        <Lock className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <div className="font-medium text-blue-900">Single Property Mode (Locked)</div>
          {message && <p className="text-sm text-blue-800 mt-1">{message}</p>}
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Alert for manual property selection warning
 */
export function ManualPropertySelectionAlert() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="font-medium mb-1">Manual Property Selection Required</div>
        <p className="text-sm">
          Your workflow doesn't filter properties via trigger or conditions. You'll need to manually specify property IDs, or add property conditions to filter automatically.
        </p>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Alert for disabled categories in ConditionBuilder
 */
export function DisabledCategoriesAlert() {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-sm">Some condition categories are disabled because the trigger already selects those entities.</AlertDescription>
    </Alert>
  );
}

/**
 * Alert shown when campaign type changes and template needs to be reselected
 */
export function TemplateReselectionAlert({ campaignType }: { campaignType: "single_property" | "multi_property" }) {
  return (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription>
        <div className="font-medium text-amber-900">Template Cleared</div>
        <p className="text-sm text-amber-800 mt-1">
          Campaign type changed to <strong>{campaignType === "single_property" ? "single property" : "multi-property"}</strong>. Please select a matching template below.
        </p>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Alert for template filtering info
 */
export function TemplateFilterAlert({ campaignType }: { campaignType: "single_property" | "multi_property" }) {
  const templateType = campaignType === "single_property" ? "single property" : "multi-property";

  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-sm">
        Showing only <strong>{templateType}</strong> templates for this campaign type.
      </AlertDescription>
    </Alert>
  );
}
