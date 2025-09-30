// app/src/lib/workflow-validation.ts

export interface WorkflowValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  triggerErrors: string[];
  conditionErrors: string[];
  actionErrors: string[];
}

export function validateWorkflow(workflow: any): WorkflowValidation {
  const validation: WorkflowValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    triggerErrors: [],
    conditionErrors: [],
    actionErrors: []
  };

  // 1. Validate Trigger
  if (!workflow.trigger) {
    validation.triggerErrors.push('A trigger is required to start the workflow');
    validation.isValid = false;
  } else {
    validateTriggerLogic(workflow.trigger, workflow, validation);
  }

  // 2. Validate Conditions
  validateConditionLogic(workflow.conditions, workflow, validation);

  // 3. Validate Action
  if (!workflow.action) {
    validation.actionErrors.push('An action is required to complete the workflow');
    validation.isValid = false;
  } else {
    validateActionLogic(workflow.action, workflow, validation);
  }

  // 4. Cross-validation
  validateWorkflowCoherence(workflow, validation);

  return validation;
}

function validateTriggerLogic(trigger: any, workflow: any, validation: WorkflowValidation) {
  // Check for conflicting conditions
  if (trigger.type === 'property_uploaded') {
    // Check if conditions also try to select properties
    const hasPropertyCondition = workflow.conditions.some(
      (c: any) => c.type === 'property_data'
    );
    
    if (hasPropertyCondition && trigger.propertyId) {
      validation.warnings.push(
        'Property is already selected by trigger. Property conditions will further filter this selection.'
      );
    }
  }

  // Validate time-based triggers
  if (trigger.type === 'time_based') {
    if (trigger.schedule === 'weekly' && !trigger.dayOfWeek) {
      validation.triggerErrors.push('Weekly schedule requires a day of week');
      validation.isValid = false;
    }
    if (trigger.schedule === 'monthly' && !trigger.dayOfMonth) {
      validation.triggerErrors.push('Monthly schedule requires a day of month');
      validation.isValid = false;
    }
  }

  // Validate email tracking triggers
  if (trigger.type === 'email_tracking') {
    if (!workflow.conditions.some((c: any) => c.type === 'campaign_data')) {
      validation.warnings.push(
        'Email tracking trigger typically requires campaign conditions to identify which emails to track'
      );
    }
  }
}

function validateConditionLogic(conditions: any[], workflow: any, validation: WorkflowValidation) {
  const conditionTypes = new Set(conditions.map(c => c.type));
  
  // Check for duplicate condition types that might conflict
  if (conditionTypes.size < conditions.length) {
    const duplicates = findDuplicates(conditions.map(c => c.type));
    validation.warnings.push(
      `Multiple conditions of same type detected: ${duplicates.join(', ')}. Ensure they don't conflict.`
    );
  }

  // Validate each condition
  conditions.forEach((condition, index) => {
    if (condition.type === 'property_data') {
      validatePropertyCondition(condition, workflow, validation);
    } else if (condition.type === 'campaign_data') {
      validateCampaignCondition(condition, workflow, validation);
    } else if (condition.type === 'buyer_data') {
      validateBuyerCondition(condition, workflow, validation);
    }
  });

  // Check for logical conflicts
  checkConditionConflicts(conditions, workflow, validation);
}

function validateActionLogic(action: any, workflow: any, validation: WorkflowValidation) {
  if (action.type === 'send_campaign') {
    // Validate campaign creation requirements
    if (action.campaignType === 'multi' && !action.properties) {
      if (!workflow.conditions.some((c: any) => c.type === 'property_data')) {
        validation.actionErrors.push(
          'Multi-property campaign requires property selection via trigger or conditions'
        );
        validation.isValid = false;
      }
    }

    if (!action.templateId) {
      validation.actionErrors.push('Campaign action requires a template selection');
      validation.isValid = false;
    }

    if (!action.audienceSelection) {
      validation.actionErrors.push('Campaign action requires audience selection');
      validation.isValid = false;
    }
  }
}

function validateWorkflowCoherence(workflow: any, validation: WorkflowValidation) {
  // Check trigger -> condition -> action flow logic
  const trigger = workflow.trigger;
  const conditions = workflow.conditions;
  const action = workflow.action;

  // Validate data flow
  if (trigger?.type === 'property_uploaded' && action?.campaignType === 'single') {
    // Single property campaign from property upload - valid
  } else if (trigger?.type === 'time_based' && action?.campaignType === 'multi') {
    // Multi-property campaign from time trigger - needs property conditions
    if (!conditions.some((c: any) => c.type === 'property_data')) {
      validation.errors.push(
        'Time-based trigger with multi-property campaign requires property conditions'
      );
      validation.isValid = false;
    }
  }

  // Check for infinite loops
  if (trigger?.type === 'campaign_status' && action?.type === 'send_campaign') {
    if (trigger.status === 'sent' && !conditions.length) {
      validation.warnings.push(
        'This workflow might create an infinite loop. Consider adding conditions to limit execution.'
      );
    }
  }

  // Validate email frequency
  if (trigger?.type === 'email_tracking' && trigger.action === 'opened') {
    if (action?.type === 'send_campaign' && action.sendImmediately) {
      validation.warnings.push(
        'Sending immediate campaigns on email open might overwhelm recipients. Consider adding a delay.'
      );
    }
  }
}

function checkConditionConflicts(conditions: any[], workflow: any, validation: WorkflowValidation) {
  // Check for impossible conditions
  const propertyConditions = conditions.filter(c => c.type === 'property_data');
  
  propertyConditions.forEach(condition => {
    const filters = condition.filters;
    
    // Check for conflicting price ranges
    if (filters.askingprice && filters.minprice) {
      if (filters.askingprice.operator === 'lt' && 
          filters.minprice.operator === 'gt' &&
          filters.askingprice.value < filters.minprice.value) {
        validation.conditionErrors.push(
          'Conflicting price conditions: asking price less than minimum price'
        );
        validation.isValid = false;
      }
    }

    // Check for conflicting location filters
    if (filters.state && filters.city) {
      // Validate city belongs to state (would need external validation)
      validation.warnings.push(
        'Ensure selected cities belong to selected states'
      );
    }
  });
}

function findDuplicates(array: any[]): string[] {
  const counts = array.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
  
  return Object.keys(counts).filter(key => counts[key] > 1);
}

function validatePropertyCondition(condition: any, workflow: any, validation: WorkflowValidation) {
  const filters = condition.filters || {};
  
  // Validate numeric filters
  ['sqft', 'acre', 'askingprice', 'minprice', 'disprice'].forEach(field => {
    if (filters[field]) {
      const filter = filters[field];
      if (filter.operator === 'between' && (!filter.value2 || filter.value >= filter.value2)) {
        validation.conditionErrors.push(
          `Invalid ${field} range: first value must be less than second value`
        );
        validation.isValid = false;
      }
    }
  });

  // Validate date filters
  ['createdAt', 'updatedAt'].forEach(field => {
    if (filters[field]) {
      const filter = filters[field];
      if (filter.operator === 'between' && (!filter.value2 || new Date(filter.value) >= new Date(filter.value2))) {
        validation.conditionErrors.push(
          `Invalid ${field} date range`
        );
        validation.isValid = false;
      }
    }
  });
}

function validateCampaignCondition(condition: any, workflow: any, validation: WorkflowValidation) {
  if (condition.metrics) {
    condition.metrics.forEach((metric: any) => {
      if (metric.operator === 'between' && (!metric.value2 || metric.value >= metric.value2)) {
        validation.conditionErrors.push(
          `Invalid metric range for ${metric.field}`
        );
        validation.isValid = false;
      }
      
      // Validate percentage metrics
      if (['openRate', 'clickRate', 'bounceRate'].includes(metric.field)) {
        if (metric.value < 0 || metric.value > 100 || (metric.value2 && metric.value2 > 100)) {
          validation.conditionErrors.push(
            `${metric.field} must be between 0 and 100`
          );
          validation.isValid = false;
        }
      }
    });
  }
}

function validateBuyerCondition(condition: any, workflow: any, validation: WorkflowValidation) {
  if (condition.scoreRange) {
    const range = condition.scoreRange;
    if (range.operator === 'between' && (!range.value2 || range.value >= range.value2)) {
      validation.conditionErrors.push('Invalid buyer score range');
      validation.isValid = false;
    }
  }
}