// Workflow validation system to enforce logical automation flows

import { WorkflowNode, WorkflowConnection, Workflow, WORKFLOW_VALIDATION_RULES } from '@/types/workflow';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  id: string;
  type: 'critical' | 'error' | 'warning';
  message: string;
  nodeId?: string;
  connectionId?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  id: string;
  message: string;
  nodeId?: string;
  suggestion: string;
}

export class WorkflowValidator {
  static validateWorkflow(workflow: Workflow): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Rule 1: Must have exactly one trigger
    const triggers = workflow.nodes.filter(node => node.type === 'trigger');
    if (triggers.length === 0) {
      errors.push({
        id: 'no_trigger',
        type: 'critical',
        message: 'Workflow must have exactly one trigger node',
        suggestion: 'Add a trigger node to start your workflow'
      });
    } else if (triggers.length > 1) {
      errors.push({
        id: 'multiple_triggers',
        type: 'error',
        message: 'Workflow cannot have multiple trigger nodes',
        suggestion: 'Remove extra trigger nodes'
      });
    }

    // Rule 2: Must have at least one action
    const actions = workflow.nodes.filter(node => node.type === 'action');
    if (actions.length === 0) {
      errors.push({
        id: 'no_actions',
        type: 'critical',
        message: 'Workflow must have at least one action node',
        suggestion: 'Add action nodes to define what your workflow should do'
      });
    }

    // Rule 3: Validate node connections
    this.validateConnections(workflow, errors, warnings);

    // Rule 4: Validate node configurations
    this.validateNodeConfigurations(workflow, errors, warnings);

    // Rule 5: Validate logical flow
    this.validateLogicalFlow(workflow, errors, warnings);

    // Rule 6: Performance warnings
    this.checkPerformanceWarnings(workflow, warnings);

    return {
      isValid: errors.filter(e => e.type === 'critical' || e.type === 'error').length === 0,
      errors,
      warnings
    };
  }

  private static validateConnections(workflow: Workflow, errors: ValidationError[], warnings: ValidationWarning[]) {
    const nodes = workflow.nodes;
    const connections = workflow.connections;

    // Check trigger nodes don't have incoming connections
    const triggers = nodes.filter(node => node.type === 'trigger');
    triggers.forEach(trigger => {
      const incomingConnections = connections.filter(conn => conn.to === trigger.id);
      if (incomingConnections.length > 0) {
        errors.push({
          id: `trigger_incoming_${trigger.id}`,
          type: 'error',
          message: 'Trigger nodes cannot have incoming connections',
          nodeId: trigger.id,
          suggestion: 'Remove connections leading to trigger nodes'
        });
      }
    });

    // Check condition nodes have exactly two outgoing connections
    const conditions = nodes.filter(node => node.type === 'condition');
    conditions.forEach(condition => {
      const outgoingConnections = connections.filter(conn => conn.from === condition.id);
      if (outgoingConnections.length !== 2) {
        errors.push({
          id: `condition_paths_${condition.id}`,
          type: 'error',
          message: 'Condition nodes must have exactly two outgoing paths (Yes/No)',
          nodeId: condition.id,
          suggestion: 'Add both Yes and No paths from condition nodes'
        });
      } else {
        // Check if we have both yes and no paths
        const hasYes = outgoingConnections.some(conn => conn.condition === 'yes');
        const hasNo = outgoingConnections.some(conn => conn.condition === 'no');
        if (!hasYes || !hasNo) {
          errors.push({
            id: `condition_missing_path_${condition.id}`,
            type: 'error',
            message: 'Condition nodes must have both Yes and No paths',
            nodeId: condition.id,
            suggestion: 'Add missing Yes or No connection'
          });
        }
      }
    });

    // Check for orphaned nodes (except triggers)
    const nonTriggerNodes = nodes.filter(node => node.type !== 'trigger');
    nonTriggerNodes.forEach(node => {
      const incomingConnections = connections.filter(conn => conn.to === node.id);
      if (incomingConnections.length === 0) {
        warnings.push({
          id: `orphaned_node_${node.id}`,
          message: `Node "${node.title}" is not connected to the workflow`,
          nodeId: node.id,
          suggestion: 'Connect this node to the workflow or remove it'
        });
      }
    });

    // Check for circular references
    this.detectCircularReferences(workflow, errors);
  }

  private static validateNodeConfigurations(workflow: Workflow, errors: ValidationError[], warnings: ValidationWarning[]) {
    workflow.nodes.forEach(node => {
      const configErrors = this.validateNodeConfig(node);
      errors.push(...configErrors);
    });
  }

  private static validateNodeConfig(node: WorkflowNode): ValidationError[] {
    const errors: ValidationError[] = [];
    const config = node.config || {};

    switch (node.subtype) {
      case 'send_email':
        if (!config.templateId) {
          errors.push({
            id: `send_email_template_${node.id}`,
            type: 'error',
            message: 'Send Email action requires a template',
            nodeId: node.id,
            suggestion: 'Select an email template'
          });
        }
        break;

      case 'send_property_alert':
        if (!config.templateId) {
          errors.push({
            id: `property_alert_template_${node.id}`,
            type: 'error',
            message: 'Property Alert action requires a template',
            nodeId: node.id,
            suggestion: 'Select a property alert template'
          });
        }
        break;

      case 'wait':
        if (!config.duration || config.duration <= 0) {
          errors.push({
            id: `wait_duration_${node.id}`,
            type: 'error',
            message: 'Wait action requires a valid duration',
            nodeId: node.id,
            suggestion: 'Set a positive duration value'
          });
        }
        if (!config.unit) {
          errors.push({
            id: `wait_unit_${node.id}`,
            type: 'error',
            message: 'Wait action requires a time unit',
            nodeId: node.id,
            suggestion: 'Select minutes, hours, days, or weeks'
          });
        }
        break;

      case 'add_to_list':
      case 'remove_from_list':
        if (!config.listId) {
          errors.push({
            id: `list_action_${node.id}`,
            type: 'error',
            message: 'List action requires a target list',
            nodeId: node.id,
            suggestion: 'Select a contact list'
          });
        }
        break;

      case 'email_status':
        if (!config.status) {
          errors.push({
            id: `email_status_condition_${node.id}`,
            type: 'error',
            message: 'Email status condition requires a status to check',
            nodeId: node.id,
            suggestion: 'Select an email status (opened, clicked, etc.)'
          });
        }
        if (!config.timeframe || config.timeframe <= 0) {
          errors.push({
            id: `email_status_timeframe_${node.id}`,
            type: 'error',
            message: 'Email status condition requires a valid timeframe',
            nodeId: node.id,
            suggestion: 'Set a positive timeframe in hours'
          });
        }
        break;

      case 'contact_property':
        if (!config.field) {
          errors.push({
            id: `contact_property_field_${node.id}`,
            type: 'error',
            message: 'Contact property condition requires a field to check',
            nodeId: node.id,
            suggestion: 'Select a contact field'
          });
        }
        if (!config.operator) {
          errors.push({
            id: `contact_property_operator_${node.id}`,
            type: 'error',
            message: 'Contact property condition requires an operator',
            nodeId: node.id,
            suggestion: 'Select a comparison operator'
          });
        }
        break;

      case 'new_property_match':
        if (!config.segmentId) {
          errors.push({
            id: `property_match_segment_${node.id}`,
            type: 'error',
            message: 'Property match trigger requires a buyer segment',
            nodeId: node.id,
            suggestion: 'Select a buyer segment'
          });
        }
        break;
    }

    return errors;
  }

  private static validateLogicalFlow(workflow: Workflow, errors: ValidationError[], warnings: ValidationWarning[]) {
    // Check for logical sequence issues
    const connections = workflow.connections;
    const nodes = workflow.nodes;

    // Find sequences that don't make logical sense
    connections.forEach(connection => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);

      if (fromNode && toNode) {
        // Check for illogical sequences
        if (fromNode.type === 'action' && fromNode.subtype === 'send_email' && 
            toNode.type === 'condition' && toNode.subtype === 'email_status') {
          // This is actually logical - checking email status after sending
        } else if (fromNode.type === 'condition' && toNode.type === 'trigger') {
          errors.push({
            id: `illogical_flow_${connection.id}`,
            type: 'error',
            message: 'Cannot connect condition to trigger',
            connectionId: connection.id,
            suggestion: 'Triggers must be the starting point of workflows'
          });
        }
      }
    });

    // Check for workflows that might overwhelm subscribers
    this.checkEmailFrequency(workflow, warnings);
  }

  private static checkEmailFrequency(workflow: Workflow, warnings: ValidationWarning[]) {
    const emailActions = workflow.nodes.filter(node => 
      node.type === 'action' && 
      (node.subtype === 'send_email' || node.subtype === 'send_property_alert')
    );

    if (emailActions.length > 5) {
      warnings.push({
        id: 'high_email_frequency',
        message: 'This workflow sends many emails which might overwhelm subscribers',
        suggestion: 'Consider adding wait nodes between emails or reducing email frequency'
      });
    }

    // Check for consecutive emails without delays
    const connections = workflow.connections;
    emailActions.forEach(emailAction => {
      const outgoingConnections = connections.filter(conn => conn.from === emailAction.id);
      outgoingConnections.forEach(connection => {
        const nextNode = workflow.nodes.find(n => n.id === connection.to);
        if (nextNode && nextNode.type === 'action' && 
            (nextNode.subtype === 'send_email' || nextNode.subtype === 'send_property_alert')) {
          warnings.push({
            id: `consecutive_emails_${emailAction.id}`,
            message: 'Consecutive emails without delay may overwhelm subscribers',
            nodeId: emailAction.id,
            suggestion: 'Add a wait node between email actions'
          });
        }
      });
    });
  }

  private static detectCircularReferences(workflow: Workflow, errors: ValidationError[]) {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const connections = workflow.connections;

    const dfs = (nodeId: string, path: string[]): boolean => {
      if (recursionStack.has(nodeId)) {
        errors.push({
          id: `circular_reference_${nodeId}`,
          type: 'error',
          message: `Circular reference detected in workflow path: ${path.join(' → ')}`,
          nodeId: nodeId,
          suggestion: 'Remove connections that create loops in your workflow'
        });
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingConnections = connections.filter(conn => conn.from === nodeId);
      for (const connection of outgoingConnections) {
        const nextNode = workflow.nodes.find(n => n.id === connection.to);
        if (nextNode && dfs(connection.to, [...path, nextNode.title])) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // Start DFS from all trigger nodes
    const triggers = workflow.nodes.filter(node => node.type === 'trigger');
    triggers.forEach(trigger => {
      dfs(trigger.id, [trigger.title]);
    });
  }

  private static checkPerformanceWarnings(workflow: Workflow, warnings: ValidationWarning[]) {
    // Check for very long wait times
    const waitNodes = workflow.nodes.filter(node => node.subtype === 'wait');
    waitNodes.forEach(waitNode => {
      const config = waitNode.config;
      const duration = config?.duration || 0;
      const unit = config?.unit || 'hours';

      let totalHours = 0;
      switch (unit) {
        case 'weeks': totalHours = duration * 7 * 24; break;
        case 'days': totalHours = duration * 24; break;
        case 'hours': totalHours = duration; break;
        case 'minutes': totalHours = duration / 60; break;
      }

      if (totalHours > 30 * 24) { // More than 30 days
        warnings.push({
          id: `long_wait_${waitNode.id}`,
          message: 'Very long wait time may cause subscribers to forget about your workflow',
          nodeId: waitNode.id,
          suggestion: 'Consider shorter wait times for better engagement'
        });
      }
    });

    // Check for complex workflows
    if (workflow.nodes.length > 20) {
      warnings.push({
        id: 'complex_workflow',
        message: 'Large workflows can be hard to manage and debug',
        suggestion: 'Consider breaking this into smaller, focused workflows'
      });
    }
  }

  static getRecommendations(workflow: Workflow): string[] {
    const recommendations: string[] = [];
    const emailActions = workflow.nodes.filter(node => 
      node.type === 'action' && 
      (node.subtype === 'send_email' || node.subtype === 'send_property_alert')
    );

    // Best practice recommendations
    if (emailActions.length > 0) {
      const hasWelcomeEmail = emailActions.some(action => 
        action.config?.templateId?.includes('welcome')
      );
      if (!hasWelcomeEmail) {
        recommendations.push('Consider adding a welcome email for new subscribers');
      }
    }

    const conditions = workflow.nodes.filter(node => node.type === 'condition');
    if (conditions.length === 0 && emailActions.length > 1) {
      recommendations.push('Add conditions to personalize the email sequence based on subscriber behavior');
    }

    const waitNodes = workflow.nodes.filter(node => node.subtype === 'wait');
    if (waitNodes.length === 0 && emailActions.length > 1) {
      recommendations.push('Add wait nodes between emails to avoid overwhelming subscribers');
    }

    return recommendations;
  }
}

// Helper function to validate individual node configurations
export function validateNodeConfig(node: WorkflowNode): string[] {
  const validator = new WorkflowValidator();
  return (validator as any).validateNodeConfig(node).map((error: ValidationError) => error.message);
}

// Helper function to get workflow health score
export function getWorkflowHealthScore(workflow: Workflow): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string;
} {
  const validation = WorkflowValidator.validateWorkflow(workflow);
  const recommendations = WorkflowValidator.getRecommendations(workflow);
  
  let score = 100;
  
  // Deduct points for errors
  score -= validation.errors.filter(e => e.type === 'critical').length * 30;
  score -= validation.errors.filter(e => e.type === 'error').length * 15;
  score -= validation.warnings.length * 5;
  score -= recommendations.length * 3;

  score = Math.max(0, Math.min(100, score));

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let feedback: string;

  if (score >= 90) {
    grade = 'A';
    feedback = 'Excellent workflow! Well-structured and follows best practices.';
  } else if (score >= 80) {
    grade = 'B';
    feedback = 'Good workflow with minor improvements needed.';
  } else if (score >= 70) {
    grade = 'C';
    feedback = 'Average workflow. Consider addressing warnings and recommendations.';
  } else if (score >= 60) {
    grade = 'D';
    feedback = 'Below average workflow. Several issues need attention.';
  } else {
    grade = 'F';
    feedback = 'Poor workflow. Major issues must be fixed before activation.';
  }

  return { score, grade, feedback };
}