// app/src/components/automation/ConditionBuilder.tsx
"use client";

import React from "react";
import { Plus, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AutomationTrigger, AutomationCondition } from "@mailivo/shared-types";
import { useDisabledCategories, DisabledCategoriesAlert } from "./trigger/PropertyUploadConfig";

interface ConditionBuilderProps {
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  onChange: (conditions: AutomationCondition[]) => void;
}

const CONDITION_CATEGORIES = [
  { value: "property_data", label: "Property Data", disabled: false },
  { value: "campaign_data", label: "Campaign Data", disabled: false },
  { value: "email_tracking", label: "Email Tracking", disabled: false },
  { value: "email_template", label: "Email Template", disabled: false },
  { value: "buyer_data", label: "Buyer Data", disabled: false },
];

// Property Data Fields
const PROPERTY_FIELDS = {
  multiSelect: ["area", "status", "featured", "landtype", "zoning", "city", "county", "state", "zip", "water", "sewer", "electric", "roadCondition", "floodplain", "ltag", "rtag"],
  boolean: ["mobilehomefriendly", "financing", "financingTwo", "financingThree", "hoapoa", "hascma"],
  number: ["sqft", "acre", "askingprice", "minprice", "disprice", "purchasePrice", "financedPrice"],
  coordinate: ["longitude", "latitude"],
  date: ["createdAt", "updatedAt"],
};

// Campaign Data Fields
const CAMPAIGN_FIELDS = {
  multiSelect: ["status"],
  number: [
    "sent",
    "delivered",
    "opened",
    "clicked",
    "bounced",
    "complained",
    "totalRecipients",
    "totalClicks",
    "open",
    "bounces",
    "successfulDeliveries",
    "clicks",
    "didNotOpen",
    "mobileOpen",
    "failed",
    "hardBounces",
    "softBounces",
  ],
  date: ["sentAt", "createdAt", "updatedAt"],
};

// Email Tracking Fields
const EMAIL_TRACKING_FIELDS = {
  date: ["sentAt", "clickedAt", "deliveredAt", "rejectedAt", "bouncedAt"],
};

// Buyer Data Fields
const BUYER_FIELDS = {
  multiSelect: ["source", "emailstatus", "preferredAreas"],
};

const OPERATORS = {
  multiSelect: [
    { value: "in", label: "Is any of" },
    { value: "not_in", label: "Is none of" },
  ],
  boolean: [{ value: "equals", label: "Is" }],
  number: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not equals" },
    { value: "greater_than", label: "Greater than" },
    { value: "less_than", label: "Less than" },
    { value: "between", label: "Between" },
  ],
  date: [
    { value: "on", label: "On date" },
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
    { value: "between", label: "Between" },
  ],
  text: [
    { value: "equals", label: "Equals" },
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does not contain" },
  ],
};

export default function ConditionBuilder({ trigger, conditions, onChange }: ConditionBuilderProps) {
  // Use the hook from PropertyUploadConfig instead of local logic
  const disabledCategories = useDisabledCategories(trigger);

  const addCondition = (category: string) => {
    const newCondition: AutomationCondition = {
      category: category as any,
      conditions: [
        {
          field: "" as any,
          operator: "" as any,
          value: "" as any,
        },
      ],
      matchAll: true,
    };

    onChange([...conditions, newCondition]);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<AutomationCondition>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates } as any;
    onChange(updated);
  };

  const addFilter = (conditionIndex: number) => {
    const updated = [...conditions];
    (updated[conditionIndex].conditions as any[]).push({
      field: "" as any,
      operator: "" as any,
      value: "" as any,
    });
    onChange(updated);
  };

  const removeFilter = (conditionIndex: number, filterIndex: number) => {
    const updated = [...conditions];
    updated[conditionIndex].conditions = (updated[conditionIndex].conditions as any[]).filter((_, i) => i !== filterIndex);
    onChange(updated);
  };

  const updateFilter = (conditionIndex: number, filterIndex: number, updates: any) => {
    const updated = [...conditions];
    updated[conditionIndex].conditions[filterIndex] = {
      ...updated[conditionIndex].conditions[filterIndex],
      ...updates,
    } as any;
    onChange(updated);
  };

  const getFieldType = (category: string, field: string): string => {
    const categoryFields: any = {
      property_data: PROPERTY_FIELDS,
      campaign_data: CAMPAIGN_FIELDS,
      email_tracking: EMAIL_TRACKING_FIELDS,
      buyer_data: BUYER_FIELDS,
    };

    const fields = categoryFields[category];
    if (!fields) return "text";

    for (const [type, fieldList] of Object.entries(fields)) {
      if ((fieldList as string[]).includes(field)) {
        return type;
      }
    }

    return "text";
  };

  const getFieldOptions = (category: string): string[] => {
    const categoryFields: any = {
      property_data: PROPERTY_FIELDS,
      campaign_data: CAMPAIGN_FIELDS,
      email_tracking: EMAIL_TRACKING_FIELDS,
      buyer_data: BUYER_FIELDS,
    };

    const fields = categoryFields[category];
    if (!fields) return [];

    return Object.values(fields).flat() as string[];
  };

  const renderFilterInput = (condition: AutomationCondition, filter: any, conditionIndex: number, filterIndex: number) => {
    const fieldType = getFieldType(condition.category, filter.field);
    const operators = (OPERATORS as any)[fieldType as keyof typeof OPERATORS] || OPERATORS.text;

    return (
      <div key={filterIndex} className="grid grid-cols-12 gap-3 items-start p-3 bg-muted/20 rounded-lg">
        {/* Field Selection */}
        <div className="col-span-3">
          <Label className="text-xs">Field</Label>
          <Select value={filter.field} onValueChange={(value) => updateFilter(conditionIndex, filterIndex, { field: value, operator: "", value: "" })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {getFieldOptions(condition.category).map((field) => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Operator Selection */}
        <div className="col-span-3">
          <Label className="text-xs">Operator</Label>
          <Select value={filter.operator} onValueChange={(value) => updateFilter(conditionIndex, filterIndex, { operator: value })} disabled={!filter.field}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op: any) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value Input */}
        <div className="col-span-5">
          <Label className="text-xs">Value</Label>
          {fieldType === "boolean" ? (
            <Select value={filter.value} onValueChange={(value) => updateFilter(conditionIndex, filterIndex, { value: value === "true" })} disabled={!filter.operator}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select value" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes / True</SelectItem>
                <SelectItem value="false">No / False</SelectItem>
              </SelectContent>
            </Select>
          ) : fieldType === "date" ? (
            <div className="space-y-2">
              <Input type="date" value={filter.value} onChange={(e) => updateFilter(conditionIndex, filterIndex, { value: e.target.value })} disabled={!filter.operator} className="mt-1" />
              {filter.operator === "between" && (
                <Input type="date" value={filter.secondValue || ""} onChange={(e) => updateFilter(conditionIndex, filterIndex, { secondValue: e.target.value })} placeholder="End date" />
              )}
            </div>
          ) : fieldType === "number" ? (
            <div className="space-y-2">
              <Input
                type="number"
                value={filter.value}
                onChange={(e) => updateFilter(conditionIndex, filterIndex, { value: e.target.value })}
                disabled={!filter.operator}
                placeholder="Enter value"
                className="mt-1"
              />
              {filter.operator === "between" && (
                <Input type="number" value={filter.secondValue || ""} onChange={(e) => updateFilter(conditionIndex, filterIndex, { secondValue: e.target.value })} placeholder="End value" />
              )}
            </div>
          ) : (
            <Input
              value={filter.value}
              onChange={(e) => updateFilter(conditionIndex, filterIndex, { value: e.target.value })}
              disabled={!filter.operator}
              placeholder="Enter value"
              className="mt-1"
            />
          )}
        </div>

        {/* Remove Button */}
        <div className="col-span-1 flex items-end justify-end">
          <Button variant="ghost" size="sm" onClick={() => removeFilter(conditionIndex, filterIndex)} className="mt-6">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Show alert if conditions are optional */}
      {conditions.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Conditions are optional. Without conditions, it runs for all matching triggers.</AlertDescription>
        </Alert>
      )}

      {/* Show disabled categories alert */}
      {disabledCategories.length > 0 && <DisabledCategoriesAlert />}

      {conditions.map((condition, conditionIndex) => (
        <div key={conditionIndex} className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant="secondary">{condition.category.replace("_", " ").toUpperCase()}</Badge>
              <Select value={condition.matchAll ? "all" : "any"} onValueChange={(value) => updateCondition(conditionIndex, { matchAll: value === "all" })}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Match ALL</SelectItem>
                  <SelectItem value="any">Match ANY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeCondition(conditionIndex)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">{condition.conditions.map((filter, filterIndex) => renderFilterInput(condition, filter, conditionIndex, filterIndex))}</div>

          <Button variant="outline" size="sm" onClick={() => addFilter(conditionIndex)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Filter
          </Button>
        </div>
      ))}

      {/* Add Condition Button */}
      <div>
        <Select onValueChange={addCondition}>
          <SelectTrigger className="w-full">
            <div className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Condition Group</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {CONDITION_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value} disabled={disabledCategories.includes(cat.value)}>
                {cat.label}
                {disabledCategories.includes(cat.value) && " (Disabled)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
