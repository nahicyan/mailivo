// app/src/app/dashboard/automations/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Play, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AutomationValidator } from "@/lib/automation-validation";
import { Automation, ValidationResult } from "@mailivo/shared-types";
import ConditionBuilder from "@/components/automation/ConditionBuilder";
import ActionConfigurator from "@/components/automation/ActionConfigurator";
import { useAutomation } from "@/hooks/useAutomation";
import { api } from "@/lib/api";

export default function EditAutomationPage() {
  const router = useRouter();
  const params = useParams();
  const automationId = params.id as string;
  
  const [automation, setAutomation] = useState<Partial<Automation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const { updateAutomation } = useAutomation();

  // Load automation data
  useEffect(() => {
    loadAutomation();
  }, [automationId]);

  const loadAutomation = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/automation/${automationId}`);
      if (response.data.success) {
        setAutomation(response.data.data);
      } else {
        toast.error("Failed to load automation");
        router.push("/dashboard/automations");
      }
    } catch (error) {
      console.error("Failed to load automation:", error);
      toast.error("Failed to load automation");
      router.push("/dashboard/automations");
    } finally {
      setLoading(false);
    }
  };

  // Real-time validation
  useEffect(() => {
    if (automation?.trigger && automation?.action) {
      const result = AutomationValidator.validateAutomation(automation);
      setValidation(result);
    }
  }, [automation]);

  const handleSave = async () => {
    if (!automation || !automation.trigger || !automation.action) {
      toast.error("Please configure trigger and action");
      return;
    }

    const validationResult = AutomationValidator.validateAutomation(automation);

    if (!validationResult.isValid) {
      toast.error("Please fix validation errors");
      return;
    }

    setIsSaving(true);

    try {
      const updateData = {
        name: automation.name,
        description: automation.description,
        conditions: automation.conditions,
        action: automation.action,
      };

      const data = await updateAutomation(automationId, updateData);

      toast.success("Automation updated successfully!");
      router.push("/dashboard/automations");
    } catch (error: any) {
      toast.error(error.message || "Failed to update automation");
    } finally {
      setIsSaving(false);
    }
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      property_uploaded: "Property Upload",
      time_based: "Time Based",
      property_viewed: "Property View",
      property_updated: "Property Update",
      campaign_status_changed: "Campaign Status",
      email_tracking_status: "Email Tracking",
      unsubscribe: "Unsubscribe",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Loading automation...</div>
      </div>
    );
  }

  if (!automation) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/automations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Automation</h1>
            <p className="text-muted-foreground">Modify your automation settings</p>
          </div>
        </div>
        <Button onClick={() => handleSave()} disabled={isSaving || !validation?.isValid}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Validation Errors */}
      {validation && !validation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Please fix the following errors:</div>
            <ul className="mt-2 space-y-1 text-sm">
              {validation.errors.map((error, index) => (
                <li key={index}>• {error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Warnings */}
      {validation && validation.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Recommendations:</div>
            <ul className="mt-2 space-y-1 text-sm">
              {validation.warnings.map((warning, index) => (
                <li key={index}>• {warning.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Automation Name *</Label>
              <Input
                id="name"
                value={automation.name || ""}
                onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
                placeholder="e.g., New Property Welcome Email"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={automation.description || ""}
                onChange={(e) => setAutomation({ ...automation, description: e.target.value })}
                placeholder="Describe what this automation does..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Status</Label>
                <p className="text-sm text-muted-foreground">Enable or disable this automation</p>
              </div>
              <Switch
                id="isActive"
                checked={automation.isActive || false}
                onCheckedChange={(checked) => setAutomation({ ...automation, isActive: checked })}
              />
            </div>
          </div>
        </div>

        {/* Step 1: Trigger (Display Only) */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                1. Trigger
                <Lock className="h-4 w-4 ml-2 text-muted-foreground" />
              </h3>
              <p className="text-sm text-muted-foreground">Trigger cannot be modified after creation</p>
            </div>
            <Badge variant="secondary">{getTriggerLabel(automation.trigger?.type || "")}</Badge>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Trigger Type: {getTriggerLabel(automation.trigger?.type || "")}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {automation.trigger?.type === "property_uploaded" && "Triggers when a new property is uploaded to Landivo"}
                {automation.trigger?.type === "time_based" && `Runs ${automation.trigger?.config?.schedule || "daily"}`}
                {automation.trigger?.type === "property_viewed" && "Triggers when a logged-in user views a property"}
                {automation.trigger?.type === "property_updated" && "Triggers when property details are updated"}
                {automation.trigger?.type === "campaign_status_changed" && "Triggers when campaign status changes"}
                {automation.trigger?.type === "email_tracking_status" && "Triggers on email tracking events"}
              </p>
            </AlertDescription>
          </Alert>
        </div>

        {/* Step 2: Conditions */}
        {automation.trigger && (
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">2. Add Conditions (Optional)</h3>
                <p className="text-sm text-muted-foreground">Filter when this automation should run</p>
              </div>
              {automation.conditions && automation.conditions.length > 0 && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </div>

            <ConditionBuilder
              trigger={automation.trigger}
              conditions={automation.conditions || []}
              onChange={(conditions) => setAutomation({ ...automation, conditions })}
            />
          </div>
        )}

        {/* Step 3: Action */}
        {automation.trigger && (
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">3. Configure Action</h3>
                <p className="text-sm text-muted-foreground">What campaign should be created?</p>
              </div>
              {automation.action && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </div>

            <ActionConfigurator
              trigger={automation.trigger}
              conditions={automation.conditions || []}
              value={automation.action}
              onChange={(action) => setAutomation({ ...automation, action })}
            />
          </div>
        )}
      </div>

      {/* Summary */}
      {automation.trigger && automation.action && validation?.isValid && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium text-green-600">Automation is ready!</div>
            <p className="text-sm text-muted-foreground mt-1">
              This automation will {automation.trigger.type.replace("_", " ")} and create a{" "}
              {automation.action.config.campaignType === "single_property" ? "single property" : "multi-property"} campaign using the "
              {automation.action.config.emailTemplate}" template.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}