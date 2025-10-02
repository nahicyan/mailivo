// app/src/components/automation/ActionConfigurator.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTemplates } from "@/hooks/useTemplates";
import { useEmailLists } from "@/hooks/useEmailLists";
import { AlertCircle, Calendar, Clock, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AutomationTrigger,
  AutomationCondition,
  AutomationAction,
} from "@mailivo/shared-types";

interface ActionConfiguratorProps {
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  value?: AutomationAction;
  onChange: (action: AutomationAction) => void;
}

export default function ActionConfigurator({
  trigger,
  conditions,
  value,
  onChange,
}: ActionConfiguratorProps) {
  const { data: templates = [], isLoading: templatesLoading } = useTemplates();
  const { data: emailLists = [], isLoading: listsLoading } = useEmailLists();
  const [agents, setAgents] = useState<any[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  // Determine property selection source
  const propertySelectionSource = (() => {
    if (
      ["property_uploaded", "property_viewed", "property_updated"].includes(
        trigger.type
      )
    ) {
      return "trigger";
    }
    if (conditions.some((c) => c.category === "property_data")) {
      return "condition";
    }
    return "manual";
  })();

  const canSelectManualProperties = propertySelectionSource === "manual";

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    // Initialize default action if not set
    if (!value) {
      onChange({
        type: "send_campaign",
        config: {
          campaignType: "single_property",
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
      // Fetch agents from Landivo API
      const agentsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_LANDIVO_API_URL}/user/public-profiles`
      );
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
    return (
      <div className="text-center py-8 text-muted-foreground">Loading...</div>
    );
  }

  if (!value) return null;

  return (
    <div className="space-y-6">
      {/* Property Selection Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium mb-1">Property Selection</div>
          <p className="text-sm">
            {propertySelectionSource === "trigger" &&
              "Properties will be selected from the trigger event."}
            {propertySelectionSource === "condition" &&
              "Properties will be filtered by the conditions you defined."}
            {propertySelectionSource === "manual" &&
              "You can manually select properties below."}
          </p>
        </AlertDescription>
      </Alert>

      {/* Campaign Type */}
      <div>
        <Label>Campaign Type *</Label>
        <Select
          value={value.config.campaignType}
          onValueChange={(val) => updateConfig({ campaignType: val })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single_property">Single Property</SelectItem>
            <SelectItem value="multi_property">Multi Property</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          {value.config.campaignType === "single_property"
            ? "Send one email per property"
            : "Include multiple properties in one email"}
        </p>
      </div>

      {/* Manual Property Selection (if applicable) */}
      {canSelectManualProperties && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">
              Manual Property Selection Required
            </div>
            <p className="text-sm">
              Your workflow doesn't filter properties via trigger or conditions.
              You'll need to manually specify property IDs, or add property
              conditions to filter automatically.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Campaign Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Campaign Name *</Label>
          <Input
            value={value.config.name}
            onChange={(e) => updateConfig({ name: e.target.value })}
            placeholder="e.g., New Property Alert"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Email Subject *</Label>
          <Input
            value={value.config.subject}
            onChange={(e) => updateConfig({ subject: e.target.value })}
            placeholder="e.g., New Property Available in {city}"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={value.config.description || ""}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Optional campaign description"
          rows={2}
          className="mt-1"
        />
      </div>

      {/* Email List Selection */}
      <div>
        <Label>Email List *</Label>
        <Select
          value={value.config.emailList}
          onValueChange={(val) => updateConfig({ emailList: val })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select email list" />
          </SelectTrigger>
          <SelectContent>
            {emailLists.map((list) => (
              <SelectItem key={list.id} value={list.id}>
                {list.name} ({list.totalContacts || 0} contacts)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Email Template Selection */}
      <div>
        <Label>Email Template *</Label>
        <Select
          value={value.config.emailTemplate}
          onValueChange={(val) => updateConfig({ emailTemplate: val })}
        >
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
          <Select
            value={value.config.selectedAgent || ""}
            onValueChange={(val) => updateConfig({ selectedAgent: val })}
          >
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
        <Select
          value={value.config.schedule}
          onValueChange={(val) => updateConfig({ schedule: val })}
        >
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
                value={
                  value.config.scheduledDate
                    ? new Date(value.config.scheduledDate)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  updateConfig({ scheduledDate: new Date(e.target.value) })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input
                type="time"
                value={
                  value.config.scheduledDate
                    ? new Date(value.config.scheduledDate)
                        .toTimeString()
                        .slice(0, 5)
                    : ""
                }
                onChange={(e) => {
                  const date = value.config.scheduledDate
                    ? new Date(value.config.scheduledDate)
                    : new Date();
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
              <Label className="text-xs">Delay Amount</Label>
              <Input
                type="number"
                min="1"
                value={value.config.delay?.amount || 1}
                onChange={(e) =>
                  updateConfig({
                    delay: {
                      ...value.config.delay,
                      amount: parseInt(e.target.value),
                    },
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Unit</Label>
              <Select
                value={value.config.delay?.unit || "hours"}
                onValueChange={(val) =>
                  updateConfig({
                    delay: {
                      ...value.config.delay,
                      unit: val,
                    },
                  })
                }
              >
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
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <h4 className="font-medium">Multi-Property Settings</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sort Strategy</Label>
              <Select
                value={
                  value.config.multiPropertyConfig?.sortStrategy || "price_asc"
                }
                onValueChange={(val) =>
                  updateConfig({
                    multiPropertyConfig: {
                      ...value.config.multiPropertyConfig,
                      sortStrategy: val,
                    },
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="manual">Manual Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Max Properties</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={value.config.multiPropertyConfig?.maxProperties || 10}
                onChange={(e) =>
                  updateConfig({
                    multiPropertyConfig: {
                      ...value.config.multiPropertyConfig,
                      maxProperties: parseInt(e.target.value),
                    },
                  })
                }
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Financing</Label>
              <p className="text-xs text-muted-foreground">
                Show payment plans for properties
              </p>
            </div>
            <Switch
              checked={
                value.config.multiPropertyConfig?.financingEnabled || false
              }
              onCheckedChange={(checked) =>
                updateConfig({
                  multiPropertyConfig: {
                    ...value.config.multiPropertyConfig,
                    financingEnabled: checked,
                  },
                })
              }
            />
          </div>

          {value.config.multiPropertyConfig?.financingEnabled && (
            <div>
              <Label>Plan Strategy</Label>
              <Select
                value={
                  value.config.multiPropertyConfig?.planStrategy ||
                  "lowest_payment"
                }
                onValueChange={(val) =>
                  updateConfig({
                    multiPropertyConfig: {
                      ...value.config.multiPropertyConfig,
                      planStrategy: val,
                    },
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lowest_payment">
                    Lowest Monthly Payment
                  </SelectItem>
                  <SelectItem value="shortest_term">Shortest Term</SelectItem>
                  <SelectItem value="manual">Manual Selection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <div className="font-medium text-blue-900 mb-1">Action Summary</div>
          <p className="text-sm text-blue-800">
            This workflow will create a{" "}
            <strong>
              {value.config.campaignType === "single_property"
                ? "single"
                : "multi"}
              -property
            </strong>{" "}
            campaign using the{" "}
            <strong>
              {templates.find((t) => t.id === value.config.emailTemplate)
                ?.name || "selected"}
            </strong>{" "}
            template and send to the{" "}
            <strong>
              {emailLists.find((l) => l.id === value.config.emailList)?.name ||
                "selected"}
            </strong>{" "}
            email list
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
