// app/src/components/automation/TriggerSelector.tsx
"use client";

import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Eye, RefreshCw, Mail, UserX, Upload, AlertCircle } from "lucide-react";
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
    value: "property_updated",
    label: "Property Updated",
    icon: RefreshCw,
    description: "When property details change",
  },
  {
    value: "closing_date",
    label: "Closing Date",
    icon: Calendar,
    description: "Send reminders before property closing date",
  },
  {
    value: "property_viewed",
    label: "Property Viewed",
    icon: Eye,
    description: "When a logged-in user views a property",
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
      closing_date: {
        timeUnit: "days",
        timeBefore: 7,
        time: "09:00",
        timezone: "America/New_York",
      },
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

            {value.config.schedule === "specific_date" && (
              <div>
                <Label>Specific Date *</Label>
                <Input
                  type="datetime-local"
                  value={value.config.specificDate ? new Date(value.config.specificDate).toISOString().slice(0, 16) : ""}
                  onChange={(e) => updateConfig({ specificDate: new Date(e.target.value) })}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        );

      case "property_viewed":
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <Label>Require Logged-In Users</Label>
              <Switch checked={value.config.requireLoggedIn} onCheckedChange={(checked) => updateConfig({ requireLoggedIn: checked })} />
            </div>

            <div>
              <Label>View Count Threshold</Label>
              <Input
                type="number"
                min="1"
                value={value.config.viewCount || 1}
                onChange={(e) => updateConfig({ viewCount: parseInt(e.target.value) })}
                placeholder="Number of views required"
                className="mt-1"
              />
            </div>
          </div>
        );

      case "property_updated":
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <Label>Update Type *</Label>
              <Select value={value.config.updateType} onValueChange={(val) => updateConfig({ updateType: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any_update">Any Update</SelectItem>
                  <SelectItem value="status_change">Status Change</SelectItem>
                  <SelectItem value="discount">Price Discount</SelectItem>
                  <SelectItem value="availability_change">Availability Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "campaign_status_changed":
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <Label>Status Changed To *</Label>
              <Select value={value.config.toStatus?.[0] || "sent"} onValueChange={(val) => updateConfig({ toStatus: [val] })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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

      case "closing_date":
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">This trigger sends automated reminders to buyers before the property closing date expires.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col">
                <Label className="text-sm font-medium mb-1">When To Run *</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={value.config.timeBefore || 7}
                  onChange={(e) => updateConfig({ timeBefore: parseInt(e.target.value) })}
                  placeholder="7"
                  className="w-30"
                />
              </div>

              <div className="flex flex-col">
                <Label className="text-sm font-medium mb-1">Time Unit *</Label>
                <Select value={value.config.timeUnit || "days"} onValueChange={(val) => updateConfig({ timeUnit: val })}>
                  <SelectTrigger className="w-37">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="months">Months Before</SelectItem>
                    <SelectItem value="weeks">Weeks Before</SelectItem>
                    <SelectItem value="days">Days Before</SelectItem>
                    <SelectItem value="hours">Hours Before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <Label className="text-sm font-medium mb-1">Time of Day *</Label>
                <Input type="time" value={value.config.time || "09:00"} onChange={(e) => updateConfig({ time: e.target.value })} className="w-32" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">What time should the reminder be sent?</p>

            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium text-foreground mb-1">Summary</p>
              <p className="text-xs text-muted-foreground">
                Email will be sent{" "}
                <strong>
                  {value.config.timeBefore || 7} {value.config.timeUnit || "days"}
                </strong>{" "}
                before the closing date at <strong>{value.config.time || "09:00"}</strong>
              </p>
            </div>
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
