// app/src/components/automation/ActionConfigurator.tsx
"use client";

import React, { useState } from "react";
import { useTemplates } from "@/hooks/useTemplates";
import { useEmailLists } from "@/hooks/useEmailLists";
import { AlertCircle, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AutomationTrigger, AutomationCondition, AutomationAction } from "@mailivo/shared-types";
import { VariableInput } from "./VariableInput";
import { EmailSubjectToggle } from "./EmailSubjectToggle";
import { EmailListSelector } from "./EmailListSelector";
import { PaymentPlanSelector } from "./PaymentPlanSelector";
import {
  useTriggerConfiguration,
  useEmailSubjectToggle,
  useDefaultActionConfig,
  useFilteredTemplates,
  useAgentLoader,
  PropertySelectionAlert,
  LockedCampaignTypeAlert,
  ManualPropertySelectionAlert,
} from "./trigger/PropertyUploadConfig";

interface ActionConfiguratorProps {
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  value?: AutomationAction;
  onChange: (action: AutomationAction) => void;
}

export default function ActionConfigurator({ trigger, conditions, value, onChange }: ActionConfiguratorProps) {
  const { data: templates = [], isLoading: templatesLoading } = useTemplates();
  const { data: emailLists = [], isLoading: listsLoading } = useEmailLists();
  const [matchAllList, setMatchAllList] = useState(value?.config?.emailList?.startsWith("Match-") || false);

  // Use trigger configuration hook
  const { canSelectManualProperties, showEmailSubjectToggle, isCampaignTypeLocked, allowedCampaignTypes } = useTriggerConfiguration(trigger, conditions, value);

  // Use email subject toggle hook
  const { useFromLandivo, handleToggleChange } = useEmailSubjectToggle(value?.config?.subject);

  // Use agent loader hook (extracted logic)
  const { agents, agentsLoading } = useAgentLoader();

  // Initialize default action config
  useDefaultActionConfig(trigger, conditions, value, onChange);

  // Filter templates based on campaign type (property upload = single only)
  const filteredTemplates = useFilteredTemplates(templates, value?.config?.campaignType || "single_property");

  const updateConfig = (updates: any) => {
    if (value) {
      // If campaign type is changing, clear template if it doesn't match new type
      if (updates.campaignType && updates.campaignType !== value.config.campaignType) {
        const currentTemplate = templates.find((t) => t.id === value.config.emailTemplate);
        const newTemplateType = updates.campaignType === "single_property" ? "single" : "multi";

        // Clear template if it doesn't match the new campaign type
        if (currentTemplate && currentTemplate.type !== newTemplateType) {
          updates.emailTemplate = "";
        }
      }

      onChange({
        ...value,
        config: {
          ...value.config,
          ...updates,
        },
      });
    }
  };

  const loading = templatesLoading || listsLoading || agentsLoading;

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (!value) return null;

  return (
    <div className="space-y-6">
      {/* Property Selection Info */}
      <PropertySelectionAlert trigger={trigger} conditions={conditions} />

      {/* Campaign Type */}
      <div>
        <Label>Campaign Type *</Label>
        {isCampaignTypeLocked ? (
          <LockedCampaignTypeAlert trigger={trigger} />
        ) : (
          <Select value={value.config.campaignType} onValueChange={(val) => updateConfig({ campaignType: val })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedCampaignTypes.singleProperty && <SelectItem value="single_property">Single Property</SelectItem>}
              {allowedCampaignTypes.multiProperty && <SelectItem value="multi_property">Multi Property</SelectItem>}
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-muted-foreground mt-1">{value.config.campaignType === "single_property" ? "Send one email per property" : "Include multiple properties in one email"}</p>
      </div>

      {/* Manual Property Selection Warning */}
      {canSelectManualProperties && <ManualPropertySelectionAlert />}

      {/* Campaign Name */}
      <VariableInput label="Campaign Name" value={value.config.name} onChange={(val) => updateConfig({ name: val })} placeholder="e.g., New Property - {city}, {state} #{#}" />

      {/* Email Subject */}
      {showEmailSubjectToggle ? (
        <EmailSubjectToggle
          value={useFromLandivo ? "" : value.config.subject}
          useFromLandivo={useFromLandivo}
          onChange={(val) => updateConfig({ subject: val })}
          onToggleChange={(useLandivo) => handleToggleChange(useLandivo, updateConfig)}
        />
      ) : (
        <div>
          <Label>Email Subject *</Label>
          <Input value={value.config.subject} onChange={(e) => updateConfig({ subject: e.target.value })} placeholder="e.g., New Property Available in {city}" className="mt-1" />
        </div>
      )}

      {/* Email List Selection */}
      <EmailListSelector
        emailLists={emailLists}
        value={value.config.emailList}
        matchAllList={matchAllList}
        onChange={(val) => updateConfig({ emailList: val })}
        onMatchAllListChange={(enabled) => {
          setMatchAllList(enabled);
          updateConfig({ emailList: enabled ? "Match-Title" : emailLists[0]?.id || "" });
        }}
      />

      {/* Email Template Selection - Locked to campaign type */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Email Template *</Label>
          <Badge variant="secondary" className="text-xs">
            {value.config.campaignType === "single_property" ? "Single Property" : "Multi-Property"} Only
          </Badge>
        </div>
        {filteredTemplates.length === 0 ? (
          <Alert variant="destructive" className="mt-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No {value.config.campaignType === "single_property" ? "single property" : "multi-property"} templates available. Please create a template first.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Select value={value.config.emailTemplate} onValueChange={(val) => updateConfig({ emailTemplate: val })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={`Select ${value.config.campaignType === "single_property" ? "single property" : "multi-property"} template`} />
              </SelectTrigger>
              <SelectContent>
                {filteredTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{template.name}</span>
                      <div className="flex items-center gap-1">
                        {template.type && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {template.type}
                          </Badge>
                        )}
                        {template.category && (
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">Templates filtered by campaign type • {filteredTemplates.length} available</p>
            </div>
          </>
        )}
      </div>

      {/* Agent Selection */}
      {agents.length > 0 && (
        <div>
          <Label>Select Agent (Optional)</Label>
          <Select value={value.config.selectedAgent || ""} onValueChange={(val) => updateConfig({ selectedAgent: val })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Choose an agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Agent</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent._id} value={agent._id}>
                  {agent.firstName} {agent.lastName} - {agent.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Schedule Configuration */}
      <div>
        <Label>Schedule *</Label>
        <Select value={value.config.schedule} onValueChange={(val) => updateConfig({ schedule: val })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Send Immediately</SelectItem>
            <SelectItem value="scheduled">Schedule for Later</SelectItem>
            <SelectItem value="time_delay">Add Time Delay</SelectItem>
          </SelectContent>
        </Select>

        {value.config.schedule === "scheduled" && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={value.config.scheduledDate ? new Date(value.config.scheduledDate).toISOString().split("T")[0] : ""}
                onChange={(e) => updateConfig({ scheduledDate: new Date(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input
                type="time"
                value={value.config.scheduledDate ? new Date(value.config.scheduledDate).toTimeString().slice(0, 5) : ""}
                onChange={(e) => {
                  const date = value.config.scheduledDate ? new Date(value.config.scheduledDate) : new Date();
                  const [hours, minutes] = e.target.value.split(":");
                  date.setHours(parseInt(hours), parseInt(minutes));
                  updateConfig({ scheduledDate: date });
                }}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {value.config.schedule === "time_delay" && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Amount</Label>
              <Input
                type="number"
                min="1"
                value={value.config.delay?.amount || ""}
                onChange={(e) =>
                  updateConfig({
                    delay: {
                      ...value.config.delay,
                      amount: parseInt(e.target.value),
                    },
                  })
                }
                placeholder="e.g., 2"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Unit</Label>
              <Select
                value={value.config.delay?.unit || "days"}
                onValueChange={(val) =>
                  updateConfig({
                    delay: {
                      ...value.config.delay,
                      unit: val,
                    },
                  })
                }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Property Configuration */}
      {value.config.campaignType === "multi_property" && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <h4 className="font-medium">Multi-Property Settings</h4>
            </div>
          </div>

          <PaymentPlanSelector
            enabled={value.config.multiPropertyConfig?.financingEnabled || false}
            planStrategy={value.config.multiPropertyConfig?.planStrategy || "plan-1"}
            onEnabledChange={(enabled) =>
              updateConfig({
                multiPropertyConfig: {
                  ...value.config.multiPropertyConfig,
                  financingEnabled: enabled,
                },
              })
            }
            onPlanStrategyChange={(strategy) =>
              updateConfig({
                multiPropertyConfig: {
                  ...value.config.multiPropertyConfig,
                  planStrategy: strategy,
                },
              })
            }
            campaignType={value.config.campaignType}
          />
        </div>
      )}

      {/* Single Property Payment Selector */}
      {value.config.campaignType === "single_property" && (
        <PaymentPlanSelector
          enabled={value.config.financingEnabled || false}
          planStrategy={value.config.planStrategy || "plan-1"}
          onEnabledChange={(enabled) => updateConfig({ financingEnabled: enabled })}
          onPlanStrategyChange={(strategy) => updateConfig({ planStrategy: strategy })}
          campaignType={value.config.campaignType}
        />
      )}

      {/* Summary */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <div className="font-medium text-blue-900 mb-1">Action Summary</div>
          <p className="text-sm text-blue-800">
            This workflow will create a <strong>{value.config.campaignType === "single_property" ? "single" : "multi"}-property</strong> campaign using the{" "}
            <strong>{filteredTemplates.find((t) => t.id === value.config.emailTemplate)?.name || "selected"}</strong> template and send to the{" "}
            <strong>{emailLists.find((l) => l.id === value.config.emailList)?.name || "selected"}</strong> email list
            {value.config.schedule === "immediate"
              ? " immediately"
              : value.config.schedule === "scheduled"
                ? " at the scheduled time"
                : ` after a ${value.config.delay?.amount} ${value.config.delay?.unit} delay`}
            .
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
