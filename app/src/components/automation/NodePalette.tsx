// app/src/components/automation/NodePalette.tsx
'use client';

import React, { useState } from 'react';
import { 
  Mail, 
  Clock, 
  Users, 
  Settings, 
  Eye, 
  MousePointer, 
  Calendar, 
  Send, 
  Trash2, 
  Filter,
  Zap,
  Home,
  Heart,
  ShoppingCart,
  Target,
  Timer,
  CheckCircle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WORKFLOW_TEMPLATES, WorkflowTemplate, WorkflowCategory } from '@mailivo/shared-types';

interface NodePaletteProps {
  onAddNode: (type: string, subtype: string, title: string, config?: any) => void;
  onLoadTemplate: (template: WorkflowTemplate) => void;
  currentNodes?: any[]; // Make currentNodes optional
  workflowCategory?: WorkflowCategory;
}

// Enhanced trigger types with logical categorization
const TRIGGER_TYPES = [
  // Time-based triggers
  { 
    id: 'contact_added', 
    label: 'Contact Added', 
    icon: Users, 
    color: 'bg-blue-500',
    category: 'entry',
    description: 'When someone joins your list',
    requires: []
  },
  { 
    id: 'campaign_sent', 
    label: 'Campaign Sent', 
    icon: Mail, 
    color: 'bg-green-500',
    category: 'campaign',
    description: 'After sending a specific campaign',
    requires: []
  },
  
  // Behavioral triggers
  { 
    id: 'email_opened', 
    label: 'Email Opened', 
    icon: Eye, 
    color: 'bg-purple-500',
    category: 'engagement',
    description: 'When subscriber opens an email',
    requires: ['campaign_sent']
  },
  { 
    id: 'email_not_opened', 
    label: 'Email Not Opened', 
    icon: Eye, 
    color: 'bg-orange-500',
    category: 'engagement',
    description: 'When email remains unopened',
    requires: ['campaign_sent', 'time_delay']
  },
  { 
    id: 'link_clicked', 
    label: 'Link Clicked', 
    icon: MousePointer, 
    color: 'bg-indigo-500',
    category: 'engagement',
    description: 'When subscriber clicks a link',
    requires: ['email_opened']
  },
  
  // Landivo-specific triggers
  { 
    id: 'property_viewed', 
    label: 'Property Viewed', 
    icon: Home, 
    color: 'bg-emerald-500',
    category: 'landivo',
    description: 'When contact views a property',
    requires: []
  },
  { 
    id: 'new_property_match', 
    label: 'New Property Match', 
    icon: Heart, 
    color: 'bg-rose-500',
    category: 'landivo',
    description: 'When new property matches criteria',
    requires: []
  },
  
  // E-commerce triggers
  { 
    id: 'cart_abandoned', 
    label: 'Cart Abandoned', 
    icon: ShoppingCart, 
    color: 'bg-amber-500',
    category: 'ecommerce',
    description: 'When items left in cart',
    requires: []
  },
];

const ACTION_TYPES = [
  // Communication actions
  { 
    id: 'send_email', 
    label: 'Send Email', 
    icon: Send, 
    color: 'bg-blue-500',
    category: 'communication',
    description: 'Send personalized email',
    configRequired: ['templateId']
  },
  { 
    id: 'send_property_alert', 
    label: 'Send Property Alert', 
    icon: Home, 
    color: 'bg-emerald-500',
    category: 'landivo',
    description: 'Send property notifications',
    configRequired: ['templateId']
  },
  
  // List management actions
  { 
    id: 'add_to_list', 
    label: 'Add to List', 
    icon: Users, 
    color: 'bg-green-500',
    category: 'management',
    description: 'Add contact to specific list',
    configRequired: ['listId']
  },
  { 
    id: 'remove_from_list', 
    label: 'Remove from List', 
    icon: Trash2, 
    color: 'bg-red-500',
    category: 'management',
    description: 'Remove from list',
    configRequired: ['listId']
  },
  { 
    id: 'update_contact', 
    label: 'Update Contact', 
    icon: Settings, 
    color: 'bg-purple-500',
    category: 'management',
    description: 'Update contact properties',
    configRequired: ['fields']
  },
  
  // Special actions
  { 
    id: 'wait', 
    label: 'Wait/Delay', 
    icon: Timer, 
    color: 'bg-purple-500',
    category: 'timing',
    description: 'Add delay before next action',
    configRequired: ['duration', 'unit']
  },
  { 
    id: 'score_lead', 
    label: 'Score Lead', 
    icon: Target, 
    color: 'bg-yellow-500',
    category: 'analytics',
    description: 'Update lead scoring',
    configRequired: ['scoreChange']
  },
];

const CONDITION_TYPES = [
  // Engagement conditions
  { 
    id: 'email_status', 
    label: 'Email Status', 
    icon: Mail, 
    color: 'bg-blue-500',
    category: 'engagement',
    description: 'Check email opened/clicked',
    paths: 2
  },
  { 
    id: 'engagement_score', 
    label: 'Engagement Score', 
    icon: Target, 
    color: 'bg-yellow-500',
    category: 'scoring',
    description: 'Check engagement level',
    paths: 2
  },
  
  // Contact data conditions
  { 
    id: 'contact_property', 
    label: 'Contact Property', 
    icon: Filter, 
    color: 'bg-green-500',
    category: 'data',
    description: 'Check contact field values',
    paths: 2
  },
  { 
    id: 'list_membership', 
    label: 'List Membership', 
    icon: Users, 
    color: 'bg-purple-500',
    category: 'segmentation',
    description: 'Check if in specific list',
    paths: 2
  },
  
  // Landivo-specific conditions
  { 
    id: 'property_interest', 
    label: 'Property Interest', 
    icon: Home, 
    color: 'bg-emerald-500',
    category: 'landivo',
    description: 'Check property viewing history',
    paths: 2
  },
  
  // Purchase behavior
  { 
    id: 'purchase_history', 
    label: 'Purchase History', 
    icon: ShoppingCart, 
    color: 'bg-orange-500',
    category: 'ecommerce',
    description: 'Check purchase activity',
    paths: 2
  },
];

export default function NodePalette({ 
  onAddNode, 
  onLoadTemplate, 
  currentNodes = [], // Provide default empty array
  workflowCategory = 'custom' 
}: NodePaletteProps) {
  const [activeTab, setActiveTab] = useState('templates');

  // Filter templates by category and industry
  const relevantTemplates = WORKFLOW_TEMPLATES.filter(template => 
    workflowCategory === 'custom' || 
    template.category === workflowCategory ||
    template.industry === 'general'
  );

  // Safely check for existing trigger with default empty array
  const hasExistingTrigger = currentNodes && currentNodes.length > 0 
    ? currentNodes.some(node => node.type === 'trigger')
    : false;
  
  const canAddTrigger = (triggerType: any) => {
    if (hasExistingTrigger) return false;
    
    // Check if required nodes exist
    if (triggerType.requires && triggerType.requires.length > 0) {
      return triggerType.requires.some((req: string) => 
        currentNodes && currentNodes.some(node => node.subtype === req)
      );
    }
    
    return true;
  };

  const handleAddNode = (type: string, item: any) => {
    onAddNode(type.slice(0, -1), item.id, item.label, item.defaultConfig);
  };

  const renderNodeGrid = (items: any[], type: string) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map(item => {
        const Icon = item.icon;
        const canAdd = type === 'triggers' ? canAddTrigger(item) : true;
        
        return (
          <Card 
            key={item.id} 
            className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
              !canAdd ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
            onClick={() => canAdd && handleAddNode(type, item)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${item.color} text-white flex-shrink-0`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {item.label}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                  {item.category && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {item.category}
                    </Badge>
                  )}
                  {type === 'triggers' && !canAdd && (
                    <Badge variant="destructive" className="mt-2 text-xs">
                      {hasExistingTrigger ? 'One trigger only' : 'Requires setup'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderTemplateGrid = () => (
    <div className="space-y-4">
      {relevantTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Available</h3>
            <p className="text-gray-500">
              No pre-built templates found for the current category. Try building a custom workflow.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {relevantTemplates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <Badge variant="outline">{template.category.replace('_', ' ')}</Badge>
                      {template.industry && (
                        <Badge variant="secondary">{template.industry}</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <div className="font-medium">{template.estimatedDuration}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Steps:</span>
                        <div className="font-medium">{template.nodes.length}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <div className="font-medium capitalize">{template.category}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Success Rate:</span>
                        <div className="font-medium">{template.expectedResults.successRate}</div>
                      </div>
                    </div>
                    
                    <Button 
                      className="mt-4"
                      size="sm"
                      onClick={() => onLoadTemplate(template)}
                    >
                      <Play size={16} className="mr-2" />
                      Use Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="text-blue-500" size={20} />
            <span>Workflow Components</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="triggers">Triggers</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="templates" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Pre-built Templates</h3>
                  <Badge variant="outline">Quick start</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Start with proven workflow templates designed for common use cases.
                </p>
                {renderTemplateGrid()}
              </TabsContent>
              
              <TabsContent value="triggers" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Triggers</h3>
                  <Badge variant={hasExistingTrigger ? "destructive" : "default"}>
                    {hasExistingTrigger ? "1 trigger added" : "Choose a trigger"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Every workflow starts with a trigger. Choose what event initiates your automation.
                </p>
                {renderNodeGrid(TRIGGER_TYPES, 'triggers')}
              </TabsContent>
              
              <TabsContent value="conditions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Conditions</h3>
                  <Badge variant="outline">Create decision points</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Add conditions to create different paths based on subscriber behavior.
                </p>
                {renderNodeGrid(CONDITION_TYPES, 'conditions')}
              </TabsContent>
              
              <TabsContent value="actions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Actions</h3>
                  <Badge variant="outline">What to do</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Define what happens when conditions are met or after delays.
                </p>
                {renderNodeGrid(ACTION_TYPES, 'actions')}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Workflow Logic Helper */}
      <Card className="border-0 shadow-sm bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="text-blue-600" size={16} />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Workflow Logic</h4>
              <p className="text-sm text-blue-700">
                <strong>Trigger</strong> → <strong>Wait/Condition</strong> → <strong>Action</strong> → <strong>Repeat</strong>
              </p>
              <ul className="text-xs text-blue-600 mt-2 space-y-1">
                <li>• Every workflow needs exactly one trigger</li>
                <li>• Conditions create Yes/No decision paths</li>
                <li>• Actions perform the actual work</li>
                <li>• Wait nodes add delays between steps</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}