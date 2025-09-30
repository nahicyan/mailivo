// app/src/app/dashboard/automations/create/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AutomationValidator } from '@/lib/automation-validation';
import { Automation, ValidationResult } from '@mailivo/shared-types';
import TriggerSelector from '@/components/automation/TriggerSelector';
import ConditionBuilder from '@/components/automation/ConditionBuilder';
import ActionConfigurator from '@/components/automation/ActionConfigurator';

export default function CreateAutomationPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  
  const [automation, setAutomation] = useState<Partial<Automation>>({
    name: '',
    description: '',
    isActive: false,
    trigger: undefined,
    conditions: [],
    action: undefined
  });

  // Real-time validation
  useEffect(() => {
    if (automation.trigger && automation.action) {
      const result = AutomationValidator.validateAutomation(automation);
      setValidation(result);
    }
  }, [automation]);

  const handleSave = async (activate: boolean = false )=> {
    if (!automation.trigger || !automation.action) {
      toast.error('Please configure trigger and action');
      return;
    }

    const validationResult = AutomationValidator.validateAutomation(automation);
    
    if (!validationResult.isValid) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/mailivo-automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...automation,
          isActive: activate
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save automation');
      }

      const data = await response.json();
      
      toast.success(activate ? 'Automation activated!' : 'Automation saved as draft');
      router.push('/dashboard/automations');
      
    } catch (error: any) {
      console.error('Save automation error:', error);
      toast.error(error.message || 'Failed to save automation');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Automation</h1>
            <p className="text-sm text-muted-foreground">
              Automate campaign creation with triggers and conditions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving || !validation?.isValid}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving || !validation?.isValid}
          >
            <Play className="h-4 w-4 mr-2" />
            Save & Activate
          </Button>
        </div>
      </div>

      {/* Validation Alerts */}
      {validation && !validation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Please fix the following errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-sm">{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation?.warnings && validation.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Warnings:</div>
            <ul className="list-disc list-inside space-y-1">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {warning.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <div className="bg-card p-6 rounded-lg border space-y-4">
        <div>
          <Label htmlFor="name">Automation Name *</Label>
          <Input
            id="name"
            value={automation.name}
            onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
            placeholder="e.g., New Property Alert to VIP Buyers"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={automation.description}
            onChange={(e) => setAutomation({ ...automation, description: e.target.value })}
            placeholder="Describe what this automation does..."
            rows={3}
            className="mt-1"
          />
        </div>
      </div>

      {/* Automation Builder */}
      <div className="space-y-6">
        {/* Step 1: Trigger */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">1. Select Trigger</h3>
              <p className="text-sm text-muted-foreground">
                What event should start this automation?
              </p>
            </div>
            {automation.trigger && (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
          </div>
          
          <TriggerSelector
            value={automation.trigger}
            onChange={(trigger) => setAutomation({ ...automation, trigger })}
          />
        </div>

        {/* Step 2: Conditions */}
        {automation.trigger && (
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">2. Add Conditions (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  Filter when this automation should run
                </p>
              </div>
              {automation.conditions && automation.conditions.length > 0 && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
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
                <p className="text-sm text-muted-foreground">
                  What campaign should be created?
                </p>
              </div>
              {automation.action && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
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
              This automation will {automation.trigger.type.replace('_', ' ')} and create a {
                automation.action.config.campaignType === 'single_property' 
                  ? 'single property' 
                  : 'multi-property'
              } campaign using the "{automation.action.config.emailTemplate}" template.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}