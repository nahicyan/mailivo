// app/src/components/automation/trigger/TimeBasedConfig.tsx
"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AutomationCondition } from "@mailivo/shared-types";

interface TimeBasedConfigProps {
  conditions: AutomationCondition[];
}

/**
 * Alert shown when time-based trigger lacks property conditions
 */
export function TimeBasedPropertyConditionAlert({ conditions }: TimeBasedConfigProps) {
  const hasPropertyConditions = conditions.some((c) => c.category === "property_data");

  if (hasPropertyConditions) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="font-medium mb-1">Property Conditions Required</div>
        <p className="text-sm">
          Time-based triggers require property conditions to determine which properties to include in scheduled campaigns. Add property conditions in step 2 above.
        </p>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Helper function to filter templates to multi-property only
 */
export function filterMultiPropertyTemplates(templates: any[]): any[] {
  return templates.filter((t) => t.type === "multi");
}