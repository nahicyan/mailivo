// app/src/components/automation/ActionConfigurator.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTemplates } from "@/hooks/useTemplates";
import { useEmailLists } from "@/hooks/useEmailLists";
import { AlertCircle, Calendar, Clock, Mail } from "lucide-react";
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
import { getTriggerConfig } from "./trigger/types";
import { PropertySelectionAlert, LockedCampaignTypeAlert } from "./trigger/PropertyUploadConfig";

interface ActionConfiguratorProps {
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  value?: AutomationAction;
  onChange: (action: AutomationAction) => void;
}

export default function ActionConfigurator({ trigger, conditions, value, onChange }: ActionConfiguratorProps) {
  const { data: templates = [], isLoading: templatesLoading } = useTemplates();
  const { data: emailLists = [], isLoading: listsLoading } = useEmailLists();
  const [agents, setAgents] = useState<any[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [useFromLandivo, setUseFromLandivo] = useState(value?.config?.subject === "bypass");
  const [matchAllList, setMatchAllList] = useState(value?.config?.emailList?.startsWith("Match-") || false);

  // Get trigger-specific configuration
  const triggerConfig = getTriggerConfig(trigger);
  const propertySelectionSource = triggerConfig.getPropertySelectionSource(conditions);
  const canSelectManualProperties = propertySelectionSource === "manual";
  const showEmailSubjectToggle = triggerConfig.showEmailSubjectToggle();
  const isCampaignTypeLocked = triggerConfig.isCampaignTypeLocked();
  const lockedCampaignType = triggerConfig.getLockedCampaignType();
  const allowedCampaignTypes = triggerConfig.getAllowedCampaignTypes();

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    // Initialize default action if not set
    if (!value) {
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
  }, []);

  const loadAgents = async () => {
    setAgentsLoading(true);
    try {
      const agentsResponse = await fetch(`${process.env.NEXT_PUBLIC_LANDIVO_API_URL}/user/public-profiles`);
      const agentsData = await agentsResponse.json();
      setAgents(agentsData);
    } catch (error) {
      console.error("Failed to load agents:", error);
    } finally {
      setAgentsLoading(false);
    }
  };

  const updateConfig = (updates: any) => {
    if (value) {
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
      {/* Property Selection Info - using modular component */}
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

      {/* Manual Property Selection Warning (if applicable) */}
      {canSelectManualProperties && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Manual Property Selection Required</div>
            <p className="text-sm">
              Your workflow doesn't filter properties via trigger or conditions. You'll need to manually specify property IDs, or add property conditions to filter automatically.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Campaign Details */}
      <VariableInput label="Campaign Name" value={value.config.name} onChange={(val) => updateConfig({ name: val })} placeholder="e.g., New Property - {city}, {state} #{#}" />

      {/* Email Subject - with optional toggle based on trigger config */}
      {showEmailSubjectToggle ? (
        <EmailSubjectToggle
          value={useFromLandivo ? "" : value.config.subject}
          useFromLandivo={useFromLandivo}
          onChange={(val) => updateConfig({ subject: val })}
          onToggleChange={(useLandivo) => {
            setUseFromLandivo(useLandivo);
            updateConfig({ subject: useLandivo ? "bypass" : "" });
          }}
        />
      ) : (
        <div className="space-y-2">
          <Label>Email Subject *</Label>
          <VariableInput label="" value={value.config.subject} onChange={(val) => updateConfig({ subject: val })} placeholder="e.g., New Property Available in {city}" />
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
          if (enabled) {
            updateConfig({ emailList: "Match-Title" });
          } else {
            updateConfig({ emailList: emailLists[0]?.id || "" });
          }
        }}
      />

      {/* Email Template Selection */}
      <div>
        <Label>Email Template *</Label>
        <Select value={value.config.emailTemplate} onValueChange={(val) => updateConfig({ emailTemplate: val })}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{template.name}</span>
                  {template.category && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {template.category}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Agent Selection (if template requires) */}
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

      {/* Multi-Property Specific Configuration */}
      {value.config.campaignType === "multi_property" && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <h4 className="font-medium">Multi-Property Settings</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">{/* Add multi-property settings here if needed */}</div>
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

      {/* For single property, also add payment selector */}
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
            <strong>{templates.find((t) => t.id === value.config.emailTemplate)?.name || "selected"}</strong> template and send to the{" "}
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
