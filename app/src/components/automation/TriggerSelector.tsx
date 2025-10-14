// app/src/components/automation/TriggerSelector.tsx
"use client";

import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Eye, RefreshCw, Mail, UserX, Upload } from "lucide-react";
import { AutomationTrigger } from "@mailivo/shared-types";

interface TriggerSelectorProps {
  value?: AutomationTrigger;
  onChange: (trigger: AutomationTrigger) => void;
}

const TRIGGER_OPTIONS = [
  {
    value: "property_uploaded",
    label: "Property Uploaded",
    icon: Upload,
    description: "When a new property is added to Landivo",
  },
  {
    value: "time_based",
    label: "Time Based",
    icon: Clock,
    description: "Run on a schedule (daily, weekly, monthly)",
  },
  {
    value: "property_viewed",
    label: "Property Viewed",
    icon: Eye,
    description: "When a logged-in user views a property",
  },
  {
    value: "property_updated",
    label: "Property Updated",
    icon: RefreshCw,
    description: "When property details change",
  },
  {
    value: "campaign_status_changed",
    label: "Campaign Status",
    icon: Mail,
    description: "When campaign status changes",
  },
  {
    value: "email_tracking_status",
    label: "Email Tracking",
    icon: Mail,
    description: "When email is opened, clicked, bounced, etc.",
  },
  {
    value: "unsubscribe",
    label: "Unsubscribe",
    icon: UserX,
    description: "When someone unsubscribes",
  },
];

export default function TriggerSelector({ value, onChange }: TriggerSelectorProps) {
  const [triggerType, setTriggerType] = useState(value?.type || "");

  const handleTypeChange = (type: string) => {
    setTriggerType(type);

    // Create default config based on type
    const defaultConfigs: Record<string, any> = {
      property_uploaded: { immediate: true },
      time_based: { schedule: "daily", time: "09:00", timezone: "America/New_York" },
      property_viewed: { requireLoggedIn: true, viewCount: 1 },
      property_updated: { updateType: "any_update" },
      campaign_status_changed: { toStatus: ["sent"] },
      email_tracking_status: { event: "opened" },
      unsubscribe: {},
    };

    onChange({
      type: type as any,
      config: defaultConfigs[type] || {},
    } as AutomationTrigger);
  };

  const updateConfig = (updates: any) => {
    if (value) {
      onChange({
        ...value,
        config: { ...value.config, ...updates },
      });
    }
  };

  const renderTriggerConfig = () => {
    if (!value) return null;

    switch (value.type) {
      case "time_based":
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <Label>Schedule *</Label>
              <Select value={value.config.schedule} onValueChange={(val) => updateConfig({ schedule: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="specific_date">Specific Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time *</Label>
              <Input type="time" value={value.config.time || "09:00"} onChange={(e) => updateConfig({ time: e.target.value })} className="mt-1" />
            </div>

            {value.config.schedule === "weekly" && (
              <div>
                <Label>Day of Week *</Label>
                <Select value={String(value.config.dayOfWeek || 1)} onValueChange={(val) => updateConfig({ dayOfWeek: parseInt(val) })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {value.config.schedule === "monthly" && (
              <div>
                <Label>Day of Month *</Label>
                <Input type="number" min="1" max="31" value={value.config.dayOfMonth || 1} onChange={(e) => updateConfig({ dayOfMonth: parseInt(e.target.value) })} className="mt-1" />
              </div>
            )}
          </div>
        );

      case "property_viewed":
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <Label>Require Logged-In Users *</Label>
              <Switch checked={value.config.requireLoggedIn} onCheckedChange={(checked) => updateConfig({ requireLoggedIn: checked })} />
            </div>

            <div>
              <Label>Trigger After X Views</Label>
              <Input type="number" min="1" value={value.config.viewCount || 1} onChange={(e) => updateConfig({ viewCount: parseInt(e.target.value) })} className="mt-1" />
            </div>
          </div>
        );

      case "property_updated":
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <Label>Update Type *</Label>
              <Select value={value.config.updateType || "any_update"} onValueChange={(val) => updateConfig({ updateType: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status_change">
                    <div className="flex flex-col py-1">
                      <span className="font-medium">Status Change</span>
                      <span className="text-xs text-muted-foreground">Property status modified (active, sold, etc.)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="any_update">
                    <div className="flex flex-col py-1">
                      <span className="font-medium">Any Update</span>
                      <span className="text-xs text-muted-foreground">Any property field modified</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="discount">
                    <div className="flex flex-col py-1">
                      <span className="font-medium">Discount</span>
                      <span className="text-xs text-muted-foreground">Property price reduced</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="availability_change">
                    <div className="flex flex-col py-1">
                      <span className="font-medium">Availability Change</span>
                      <span className="text-xs text-muted-foreground">Property availability status changed</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "email_tracking_status":
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <Label>Event Type *</Label>
              <Select value={value.config.event} onValueChange={(val) => updateConfig({ event: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opened">Email Opened</SelectItem>
                  <SelectItem value="clicked">Link Clicked</SelectItem>
                  <SelectItem value="delivered">Email Delivered</SelectItem>
                  <SelectItem value="bounced">Email Bounced</SelectItem>
                  <SelectItem value="rejected">Email Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {value.config.event === "clicked" && (
              <div>
                <Label>Link Text (Optional)</Label>
                <Input value={value.config.linkText || ""} onChange={(e) => updateConfig({ linkText: e.target.value })} placeholder="Filter by specific link text" className="mt-1" />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Trigger Type *</Label>
        <Select value={triggerType} onValueChange={handleTypeChange}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select a trigger..." />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {renderTriggerConfig()}
    </div>
  );
}
