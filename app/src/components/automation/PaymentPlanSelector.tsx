// app/src/components/automation/PaymentPlanSelector.tsx
'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Info } from 'lucide-react';

interface PaymentPlanSelectorProps {
  enabled: boolean;
  planStrategy: string;
  onEnabledChange: (enabled: boolean) => void;
  onPlanStrategyChange: (strategy: string) => void;
  campaignType: 'single_property' | 'multi_property';
}

export function PaymentPlanSelector({
  enabled,
  planStrategy,
  onEnabledChange,
  onPlanStrategyChange,
  campaignType
}: PaymentPlanSelectorProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <div>
            <Label>Enable Financing</Label>
            <p className="text-xs text-muted-foreground">
              Show payment plans for properties
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {enabled && (
        <>
          <div>
            <Label>Payment Plan Strategy *</Label>
            <Select value={planStrategy} onValueChange={onPlanStrategyChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plan-1">Plan 1</SelectItem>
                <SelectItem value="plan-2">Plan 2 (with fallback)</SelectItem>
                <SelectItem value="plan-3">Plan 3 (with validation)</SelectItem>
                <SelectItem value="monthly-low">Lowest Monthly Payment</SelectItem>
                <SelectItem value="monthly-high">Highest Monthly Payment</SelectItem>
                <SelectItem value="down-payment-low">Lowest Down Payment</SelectItem>
                <SelectItem value="down-payment-high">Highest Down Payment</SelectItem>
                <SelectItem value="interest-low">Lowest Interest Rate</SelectItem>
                <SelectItem value="interest-high">Highest Interest Rate</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {getStrategyDescription(planStrategy)}
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Payment plans will be selected automatically based on your strategy for {campaignType === 'single_property' ? 'this property' : 'all properties'}.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}

function getStrategyDescription(strategy: string): string {
  const descriptions: Record<string, string> = {
    'plan-1': 'Use the first available payment plan',
    'plan-2': 'Prefer Plan 2, fallback to Plan 1 if unavailable',
    'plan-3': 'Prefer Plan 3, requires custom selection for properties without it',
    'monthly-low': 'Select the plan with the lowest monthly payment',
    'monthly-high': 'Select the plan with the highest monthly payment',
    'down-payment-low': 'Select the plan with the lowest down payment',
    'down-payment-high': 'Select the plan with the highest down payment',
    'interest-low': 'Select the plan with the lowest interest rate',
    'interest-high': 'Select the plan with the highest interest rate'
  };
  return descriptions[strategy] || 'Select how payment plans should be chosen';
}