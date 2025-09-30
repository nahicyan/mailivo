// app/src/app/dashboard/landivo/campaigns/lib/stepConfig.ts
import { 
  Building, 
  FileText, 
  Users, 
  User, 
  CreditCard, 
  Camera, 
  Mail, 
  Clock,
  ListChecks,
  FileCode
} from 'lucide-react';

export interface StepDefinition {
  id: string;
  title: string;
  icon: any;
  description: string;
  component: string;
  isConditional?: boolean;
  conditionKey?: string;
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
    // SPLIT: Separate Email List step
    {
      id: 'email-list',
      title: 'Email List',
      icon: ListChecks,
      description: 'Select email list',
      component: 'EmailListSelection'
    },
    // SPLIT: Separate Email Template step
    {
      id: 'email-template',
      title: 'Email Template',
      icon: FileCode,
      description: 'Choose email template',
      component: 'EmailTemplateSelection'
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
    // SPLIT: Separate Email List step (multi-select capable)
    {
      id: 'email-list',
      title: 'Email List',
      icon: ListChecks,
      description: 'Select email lists',
      component: 'MultiEmailListSelection'
    },
    // SPLIT: Separate Email Template step
    {
      id: 'email-template',
      title: 'Email Template',
      icon: FileCode,
      description: 'Choose email template',
      component: 'MultiEmailTemplateSelection'
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