// app/src/components/automation/WorkflowBuilder.tsx

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Save, 
  Play, 
  AlertTriangle,
  CheckCircle2,
  Settings,
  Zap
} from 'lucide-react';
import TriggerSelector from './TriggerSelector';
import ConditionBuilder from './ConditionBuilder';
import ActionConfigurator from './ActionConfigurator';
import WorkflowValidator from './WorkflowValidator';
import { validateWorkflow, WorkflowValidation } from '@/lib/workflow-validation';

interface WorkflowBuilderProps {
  onSave: (workflow: any) => Promise<void>;
  initialWorkflow?: any;
}

export default function WorkflowBuilder({ onSave, initialWorkflow }: WorkflowBuilderProps) {
  const [workflow, setWorkflow] = useState({
    name: initialWorkflow?.name || '',
    description: initialWorkflow?.description || '',
    trigger: initialWorkflow?.trigger || null,
    conditions: initialWorkflow?.conditions || [],
    action: initialWorkflow?.action || null,
    isActive: initialWorkflow?.isActive || false
  });

  const [validation, setValidation] = useState<WorkflowValidation | null>(null);
  const [currentStep, setCurrentStep] = useState<'trigger' | 'conditions' | 'action'>('trigger');

  const handleTriggerSelect = (trigger: any) => {
    const newWorkflow = { ...workflow, trigger };
    setWorkflow(newWorkflow);
    
    // Auto-validate when trigger changes
    const validationResult = validateWorkflow(newWorkflow);
    setValidation(validationResult);
    
    // Auto-advance to conditions if valid
    if (trigger && validationResult.triggerErrors.length === 0) {
      setCurrentStep('conditions');
    }
  };

  const handleConditionsUpdate = (conditions: any[]) => {
    const newWorkflow = { ...workflow, conditions };
    setWorkflow(newWorkflow);
    
    // Validate conditions
    const validationResult = validateWorkflow(newWorkflow);
    setValidation(validationResult);
  };

  const handleActionConfigure = (action: any) => {
    const newWorkflow = { ...workflow, action };
    setWorkflow(newWorkflow);
    
    // Final validation
    const validationResult = validateWorkflow(newWorkflow);
    setValidation(validationResult);
  };

  const handleSave = async () => {
    const validationResult = validateWorkflow(workflow);
    
    if (!validationResult.isValid) {
      setValidation(validationResult);
      return;
    }

    try {
      await onSave(workflow);
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  };

  const isStepValid = (step: string) => {
    if (!validation) return false;
    
    switch (step) {
      case 'trigger':
        return workflow.trigger && validation.triggerErrors.length === 0;
      case 'conditions':
        return validation.conditionErrors.length === 0;
      case 'action':
        return workflow.action && validation.actionErrors.length === 0;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Workflow Name</Label>
            <Input
              id="name"
              value={workflow.name}
              onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
              placeholder="e.g., New Property Alert"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={workflow.description}
              onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
              placeholder="Describe what this workflow does"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Tabs value={currentStep} onValueChange={(v) => setCurrentStep(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trigger" className="relative">
            <Zap className="mr-2 h-4 w-4" />
            Trigger
            {isStepValid('trigger') && (
              <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-green-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="conditions" className="relative">
            <Settings className="mr-2 h-4 w-4" />
            Conditions
            {isStepValid('conditions') && (
              <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-green-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="action" className="relative">
            <Play className="mr-2 h-4 w-4" />
            Action
            {isStepValid('action') && (
              <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-green-500" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trigger" className="mt-6">
          <TriggerSelector
            selectedTrigger={workflow.trigger}
            onSelect={handleTriggerSelect}
            existingConditions={workflow.conditions}
          />
        </TabsContent>

        <TabsContent value="conditions" className="mt-6">
          <ConditionBuilder
            conditions={workflow.conditions}
            onChange={handleConditionsUpdate}
            trigger={workflow.trigger}
          />
        </TabsContent>

        <TabsContent value="action" className="mt-6">
          <ActionConfigurator
            action={workflow.action}
            onChange={handleActionConfigure}
            trigger={workflow.trigger}
            conditions={workflow.conditions}
          />
        </TabsContent>
      </Tabs>

      {/* Validation Messages */}
      {validation && !validation.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              {validation.errors.map((error, idx) => (
                <div key={idx} className="text-sm">• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!validation?.isValid}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Workflow
        </Button>
      </div>
    </div>
  );
}