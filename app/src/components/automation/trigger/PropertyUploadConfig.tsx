// app/src/components/automation/trigger/PropertyUploadConfig.tsx
"use client";

import React from "react";
import { Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTriggerConfig } from "./types";
import { AutomationTrigger, AutomationCondition } from "@mailivo/shared-types";

interface PropertyUploadConfigProps {
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
}

/**
 * Property Upload trigger-specific configuration component
 * This component provides the UI elements specific to property upload triggers:
 * - Property selection info alert
 * - Locked campaign type alert
 */
export function PropertyUploadConfig({ trigger, conditions }: PropertyUploadConfigProps) {
  const triggerConfig = getTriggerConfig(trigger);
  const propertySelectionSource = triggerConfig.getPropertySelectionSource(conditions);
  const propertyMessage = triggerConfig.getPropertySelectionMessage(propertySelectionSource);
  const isCampaignTypeLocked = triggerConfig.isCampaignTypeLocked();
  const lockedMessage = triggerConfig.getLockedCampaignTypeMessage();

  return {
    propertySelectionSource,
    propertyMessage,
    isCampaignTypeLocked,
    lockedMessage,
    showEmailSubjectToggle: triggerConfig.showEmailSubjectToggle(),
    allowedCampaignTypes: triggerConfig.getAllowedCampaignTypes(),
  };
}

/**
 * Render property selection alert
 */
export function PropertySelectionAlert({ trigger, conditions }: PropertyUploadConfigProps) {
  const triggerConfig = getTriggerConfig(trigger);
  const source = triggerConfig.getPropertySelectionSource(conditions);
  const message = triggerConfig.getPropertySelectionMessage(source);

  return (
    <Alert>
      <AlertDescription>
        <div className="font-medium mb-1">Property Selection</div>
        <p className="text-sm">{message}</p>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Render locked campaign type alert (if applicable)
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