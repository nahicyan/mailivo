// app/src/components/automation/trigger/TimeBasedConfig.tsx
"use client";

import React from "react";
import { useEffect } from "react";
import { Lock, AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AutomationTrigger, AutomationCondition } from "@mailivo/shared-types";

/**
 * HOOKS
 */

/**
 * Hook to get available schedule options based on trigger type
 * Time-based triggers disable "Schedule for later" since the trigger itself is the schedule
 */
export function useScheduleOptions(trigger: AutomationTrigger) {
  const isTimeBased = trigger.type === "time_based";

  const availableOptions = React.useMemo(() => {
    if (isTimeBased) {
      return [
        { value: "immediate", label: "Send Immediately", disabled: false },
        { value: "time_delay", label: "Add Time Delay", disabled: false },
      ];
    }

    return [
      { value: "immediate", label: "Send Immediately", disabled: false },
      { value: "scheduled", label: "Schedule for Later", disabled: false },
      { value: "time_delay", label: "Add Time Delay", disabled: false },
    ];
  }, [isTimeBased]);

  return { availableOptions, isTimeBased };
}

/**
 * Hook to validate if email subject is required (no bypass allowed)
 */
export function useRequiredEmailSubject(trigger: AutomationTrigger) {
  const isRequired = trigger.type === "time_based";

  return {
    isRequired,
    validationMessage: isRequired ? "Email subject is required for time-based automations. Subject bypass is not available." : null,
  };
}

/**
 * Hook to initialize time-based automation action config
 * Time-based triggers require multi-property campaigns with multiPropertyConfig
 */
export function useTimeBasedActionInit(trigger: AutomationTrigger, conditions: AutomationCondition[], value: AutomationAction | undefined, onChange: (action: AutomationAction) => void) {
  useEffect(() => {
    // Only initialize if trigger is time_based and value is not set
    if (trigger.type === "time_based" && !value) {
      onChange({
        type: "send_campaign",
        config: {
          campaignType: "multi_property", // Time-based ALWAYS multi-property
          propertySelection: {
            source: "condition", // Time-based always uses conditions
            propertyIds: [],
          },
          emailList: "",
          emailTemplate: "",
          schedule: "immediate",
          name: "",
          subject: "",
          // REQUIRED for multi-property campaigns
          multiPropertyConfig: {
            sortStrategy: "newest",
            maxProperties: 10,
            financingEnabled: false,
            planStrategy: "plan-1",
          },
        },
      });
    }
  }, []); // Only run once on mount
}

/**
 * Hook to ensure multiPropertyConfig exists when updating time-based actions
 * Use this to safely update config for time-based triggers
 */
export function useTimeBasedConfigUpdater(trigger: AutomationTrigger, value: AutomationAction | undefined) {
  return (updates: any) => {
    if (trigger.type !== "time_based" || !value) {
      return updates;
    }

    // Ensure multiPropertyConfig exists
    if (!updates.multiPropertyConfig && !value.config.multiPropertyConfig) {
      updates.multiPropertyConfig = {
        sortStrategy: "newest",
        maxProperties: 10,
        financingEnabled: false,
        planStrategy: "plan-1",
      };
    }

    return updates;
  };
}

/**
 * UTILITY FUNCTIONS
 */

/**
 * Check if trigger type requires email subject (no bypass)
 */
export function requiresEmailSubject(triggerType: string): boolean {
  return triggerType === "time_based";
}

/**
 * Check if "Schedule for later" should be disabled
 */
export function isScheduleLaterDisabled(triggerType: string): boolean {
  return triggerType === "time_based";
}

/**
 * Get schedule options filtered by trigger type
 */
export function getScheduleOptions(triggerType: string) {
  const isTimeBased = triggerType === "time_based";

  if (isTimeBased) {
    return [
      { value: "immediate", label: "Send Immediately" },
      { value: "time_delay", label: "Add Time Delay" },
    ];
  }

  return [
    { value: "immediate", label: "Send Immediately" },
    { value: "scheduled", label: "Schedule for Later" },
    { value: "time_delay", label: "Add Time Delay" },
  ];
}

/**
 * Validate schedule selection for trigger type
 */
export function validateScheduleForTrigger(schedule: string, triggerType: string): { valid: boolean; error?: string } {
  if (triggerType === "time_based" && schedule === "scheduled") {
    return {
      valid: false,
      error: "Time-based triggers cannot use 'Schedule for later' since the trigger defines the schedule.",
    };
  }

  return { valid: true };
}

/**
 * COMPONENTS
 */

/**
 * Alert explaining time-based trigger locks multi-property mode
 */
export function TimeBasedCampaignTypeLock() {
  return (
    <div className="mt-1">
      <Alert className="bg-purple-50 border-purple-200">
        <Lock className="h-4 w-4 text-purple-600" />
        <AlertDescription>
          <div className="font-medium text-purple-900">Multi-Property Mode (Locked)</div>
          <p className="text-sm text-purple-800 mt-1">Time-based triggers require multi-property campaigns to aggregate properties on schedule.</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Alert for schedule restrictions on time-based triggers
 */
export function TimeBasedScheduleInfo() {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Clock className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-sm">
        <div className="font-medium text-blue-900 mb-1">Schedule Configured by Trigger</div>
        <p className="text-blue-800">The trigger defines when campaigns run (daily/weekly/monthly). Choose when to send after the trigger fires.</p>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Alert for required email subject (no bypass)
 */
export function RequiredEmailSubjectAlert() {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-sm">Email subject is required for time-based automations. Subject bypass is not available.</AlertDescription>
    </Alert>
  );
}

/**
 * Alert warning about missing property conditions
 */
export function TimeBasedPropertyConditionsWarning({ hasPropertyConditions }: { hasPropertyConditions: boolean }) {
  if (hasPropertyConditions) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="font-medium mb-1">Property Conditions Required</div>
        <p className="text-sm">
          Time-based triggers require property conditions to determine which properties to include in the scheduled campaign. Add property conditions in the conditions section.
        </p>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Info alert about campaign data being disabled
 */
export function CampaignDataDisabledInfo() {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-sm">
        <strong>Campaign Data conditions are disabled</strong> for time-based triggers as they don't apply to scheduled property campaigns.
      </AlertDescription>
    </Alert>
  );
}

/**
 * Comprehensive info panel for time-based triggers
 */
export function TimeBasedTriggerInfo({ conditions }: { conditions: AutomationCondition[] }) {
  const hasPropertyConditions = conditions.some((c) => c.category === "property_data");

  return (
    <div className="space-y-3">
      <Alert className="bg-purple-50 border-purple-200">
        <Clock className="h-4 w-4 text-purple-600" />
        <AlertDescription>
          <div className="font-medium text-purple-900 mb-2">Time-Based Trigger Configuration</div>
          <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
            <li>
              Campaign type locked to <strong>multi-property</strong>
            </li>
            <li>
              Email subject <strong>required</strong> (no bypass option)
            </li>
            <li>Schedule configured by trigger timing</li>
            <li>Campaign data conditions disabled</li>
            <li>Property conditions recommended for filtering</li>
          </ul>
        </AlertDescription>
      </Alert>

      {!hasPropertyConditions && <TimeBasedPropertyConditionsWarning hasPropertyConditions={false} />}
    </div>
  );
}
