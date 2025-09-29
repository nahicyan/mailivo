// app/src/app/dashboard/landivo/campaigns/lib/stepConfig.ts
import { LucideIcon, Building, FileText, Users, User, CreditCard, Camera, Mail, Clock } from 'lucide-react';

export interface StepDefinition {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  component: string; // Component name for dynamic import
  isConditional?: boolean; // Whether this step appears conditionally
  conditionKey?: string; // Key to check in conditions object
}

export interface StepConfig {
  baseSteps: StepDefinition[];
  conditionalSteps: StepDefinition[];
  finalSteps: StepDefinition[];
}

// Single Property Campaign Steps
export const singlePropertySteps: StepConfig = {
  baseSteps: [
    {
      id: 'property',
      title: 'Property',
      icon: Building,
      description: 'Select target property',
      component: 'PropertySelection'
    },
    {
      id: 'basic-info',
      title: 'Basic Info',
      icon: FileText,
      description: 'Campaign name and description',
      component: 'BasicInfo'
    },
    {
      id: 'audience',
      title: 'Audience',
      icon: Users,
      description: 'Choose email list and template',
      component: 'AudienceSelection'
    }
  ],
  conditionalSteps: [],
  finalSteps: [
    {
      id: 'payment',
      title: 'Payment Options',
      icon: CreditCard,
      description: 'Select payment plan',
      component: 'PaymentOptions'
    },
    {
      id: 'pictures',
      title: 'Pictures',
      icon: Camera,
      description: 'Select property images',
      component: 'PictureSelection'
    },
    {
      id: 'subject',
      title: 'Subject',
      icon: Mail,
      description: 'Create email subject line',
      component: 'SubjectLine'
    },
    {
      id: 'schedule',
      title: 'Schedule',
      icon: Clock,
      description: 'Set timing and volume',
      component: 'Scheduling'
    }
  ]
};

// Multi Property Campaign Steps
export const multiPropertySteps: StepConfig = {
  baseSteps: [
    {
      id: 'property',
      title: 'Property',
      icon: Building,
      description: 'Select properties',
      component: 'MultiPropertySelection'
    },
    {
      id: 'basic-info',
      title: 'Basic Info',
      icon: FileText,
      description: 'Campaign name and description',
      component: 'MultiBasicInfo'
    },
    {
      id: 'audience',
      title: 'Audience',
      icon: Users,
      description: 'Choose email list and template',
      component: 'MultiAudienceSelection'
    }
  ],
  conditionalSteps: [
    {
      id: 'agent-profile',
      title: 'Agent Profile',
      icon: User,
      description: 'Select agent contact info',
      component: 'MultiAgentProfile',
      isConditional: true,
      conditionKey: 'showAgentProfileStep'
    }
  ],
  finalSteps: [
    {
      id: 'payment',
      title: 'Payment Options',
      icon: CreditCard,
      description: 'Select payment plan',
      component: 'MultiPaymentOptions'
    },
    {
      id: 'pictures',
      title: 'Pictures',
      icon: Camera,
      description: 'Select property images',
      component: 'MultiPictureSelection'
    },
    {
      id: 'subject',
      title: 'Subject',
      icon: Mail,
      description: 'Create email subject line',
      component: 'MultiSubjectLine'
    },
    {
      id: 'schedule',
      title: 'Schedule',
      icon: Clock,
      description: 'Set timing and volume',
      component: 'MultiScheduling'
    }
  ]
};

/**
 * Build the complete step array based on conditions
 */
export function buildStepArray(
  config: StepConfig,
  conditions: Record<string, boolean> = {}
): StepDefinition[] {
  const steps = [...config.baseSteps];
  
  // Add conditional steps if their conditions are met
  for (const conditionalStep of config.conditionalSteps) {
    if (conditionalStep.isConditional && conditionalStep.conditionKey) {
      if (conditions[conditionalStep.conditionKey]) {
        steps.push(conditionalStep);
      }
    } else {
      steps.push(conditionalStep);
    }
  }
  
  steps.push(...config.finalSteps);
  
  return steps;
}

/**
 * Get step by index (1-based for UI display)
 */
export function getStepByIndex(steps: StepDefinition[], index: number): StepDefinition | null {
  return steps[index - 1] || null;
}

/**
 * Get step index by ID (returns 1-based index)
 */
export function getStepIndexById(steps: StepDefinition[], id: string): number {
  return steps.findIndex(s => s.id === id) + 1;
}

/**
 * Get total step count
 */
export function getTotalSteps(steps: StepDefinition[]): number {
  return steps.length;
}