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
  Pause,
  Bell,
  UserPlus,
  UserMinus,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WORKFLOW_TEMPLATES, WorkflowTemplate, WorkflowCategory } from '@mailivo/shared-types';
import { cn } from '@/lib/utils';

interface NodePaletteProps {
  onAddNode: (type: string, subtype: string, title: string, config?: any) => void;
  onLoadTemplate?: (template: WorkflowTemplate) => void;
  currentNodes?: any[];
  workflowCategory?: WorkflowCategory;
}

// Enhanced trigger types with logical categorization
const TRIGGER_TYPES = [
  // Time-based triggers
  { 
    id: 'contact_added', 
    label: 'Contact Added', 
    icon: UserPlus, 
    color: 'from-blue-500 to-blue-600',
    category: 'entry',
    description: 'When someone joins',
    requires: []
  },
  { 
    id: 'campaign_sent', 
    label: 'Campaign Sent', 
    icon: Send, 
    color: 'from-green-500 to-green-600',
    category: 'campaign',
    description: 'After sending email',
    requires: []
  },
  
  // Behavioral triggers
  { 
    id: 'email_opened', 
    label: 'Email Opened', 
    icon: Eye, 
    color: 'from-purple-500 to-purple-600',
    category: 'engagement',
    description: 'When email opened',
    requires: ['campaign_sent']
  },
  { 
    id: 'email_not_opened', 
    label: 'Email Not Opened', 
    icon: Eye, 
    color: 'from-orange-500 to-orange-600',
    category: 'engagement',
    description: 'When email remains unopened',
    requires: ['campaign_sent', 'time_delay']
  },
  { 
    id: 'link_clicked', 
    label: 'Link Clicked', 
    icon: MousePointer, 
    color: 'from-indigo-500 to-indigo-600',
    category: 'engagement',
    description: 'When link clicked',
    requires: ['email_opened']
  },
  
  // Landivo-specific triggers
  { 
    id: 'property_viewed', 
    label: 'Property Viewed', 
    icon: Home, 
    color: 'from-emerald-500 to-emerald-600',
    category: 'landivo',
    description: 'Property interaction',
    requires: []
  },
  { 
    id: 'new_property_match', 
    label: 'New Property Match', 
    icon: Heart, 
    color: 'from-rose-500 to-rose-600',
    category: 'landivo',
    description: 'When new property matches criteria',
    requires: []
  },
  
  // E-commerce triggers
  { 
    id: 'cart_abandoned', 
    label: 'Cart Abandoned', 
    icon: ShoppingCart, 
    color: 'from-amber-500 to-amber-600',
    category: 'ecommerce',
    description: 'Cart left inactive',
    requires: []
  }
];

// Action types organized by functionality
const ACTION_TYPES = [
  // Communication actions
  { 
    id: 'send_email', 
    label: 'Send Email', 
    icon: Mail, 
    color: 'from-blue-500 to-blue-600',
    category: 'communication',
    description: 'Send personalized email'
  },
  { 
    id: 'add_to_list', 
    label: 'Add to List', 
    icon: UserPlus, 
    color: 'from-green-500 to-green-600',
    category: 'management',
    description: 'Add contact to list'
  },
  { 
    id: 'remove_from_list', 
    label: 'Remove from List', 
    icon: UserMinus, 
    color: 'from-red-500 to-red-600',
    category: 'management',
    description: 'Remove from list'
  },
  { 
    id: 'update_contact', 
    label: 'Update Contact', 
    icon: RefreshCw, 
    color: 'from-purple-500 to-purple-600',
    category: 'management',
    description: 'Update properties'
  },
  { 
    id: 'wait_timer', 
    label: 'Wait/Delay', 
    icon: Clock, 
    color: 'from-yellow-500 to-yellow-600',
    category: 'timing',
    description: 'Add time delay'
  },
  { 
    id: 'send_notification', 
    label: 'Send Alert', 
    icon: Bell, 
    color: 'from-orange-500 to-orange-600',
    category: 'analytics',
    description: 'Internal notification'
  }
];

// Condition types for decision branching
const CONDITION_TYPES = [
  // Email engagement conditions
  { 
    id: 'email_status', 
    label: 'Email Status', 
    icon: Mail, 
    color: 'from-blue-500 to-blue-600',
    category: 'engagement',
    description: 'Check engagement',
    paths: 2
  },
  { 
    id: 'engagement_score', 
    label: 'Engagement Score', 
    icon: Target, 
    color: 'from-yellow-500 to-yellow-600',
    category: 'scoring',
    description: 'Check score level',
    paths: 2
  },
  
  // Contact data conditions
  { 
    id: 'contact_property', 
    label: 'Contact Data', 
    icon: Filter, 
    color: 'from-green-500 to-green-600',
    category: 'data',
    description: 'Check field values',
    paths: 2
  },
  { 
    id: 'list_membership', 
    label: 'List Membership', 
    icon: Users, 
    color: 'from-purple-500 to-purple-600',
    category: 'segmentation',
    description: 'Check list status',
    paths: 2
  },
  
  // Landivo-specific conditions
  { 
    id: 'property_interest', 
    label: 'Property Interest', 
    icon: Home, 
    color: 'from-emerald-500 to-emerald-600',
    category: 'landivo',
    description: 'Viewing history',
    paths: 2
  },
  
  // Purchase behavior
  { 
    id: 'purchase_history', 
    label: 'Purchase History', 
    icon: ShoppingCart, 
    color: 'from-orange-500 to-orange-600',
    category: 'ecommerce',
    description: 'Purchase activity',
    paths: 2
  },
];

export default function NodePalette({ 
  onAddNode, 
  onLoadTemplate, 
  currentNodes = [],
  workflowCategory = 'custom' 
}: NodePaletteProps) {
  const [activeTab, setActiveTab] = useState('triggers');

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

  const renderNodeCard = (item: any, type: string) => {
    const Icon = item.icon;
    const canAdd = type === 'triggers' ? canAddTrigger(item) : true;
    
    return (
      <div
        key={item.id}
        className={cn(
          "group relative overflow-hidden rounded-lg border bg-white transition-all cursor-pointer",
          canAdd 
            ? "hover:shadow-md hover:border-gray-300" 
            : "opacity-50 cursor-not-allowed"
        )}
        onClick={() => canAdd && handleAddNode(type, item)}
      >
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg bg-gradient-to-r text-white shadow-sm flex-shrink-0",
              item.color
            )}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 truncate">
                {item.label}
              </h4>
              <p className="text-xs text-gray-500">
                {item.description}
              </p>
            </div>
          </div>
          
          {!canAdd && type === 'triggers' && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center backdrop-blur-sm">
              <span className="text-xs text-red-600 font-medium">
                Trigger already added
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNodeGrid = (items: any[], type: string) => (
    <div className="grid grid-cols-1 gap-2">
      {items.map(item => renderNodeCard(item, type))}
    </div>
  );

  const tabConfig = [
    { value: 'triggers', label: 'Triggers', items: TRIGGER_TYPES, icon: Zap },
    { value: 'conditions', label: 'Conditions', items: CONDITION_TYPES, icon: Filter },
    { value: 'actions', label: 'Actions', items: ACTION_TYPES, icon: Target }
  ];

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Main Card */}
      <Card className="flex-1 border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-sm">
              <Zap size={14} />
            </div>
            <span className="font-semibold text-gray-900">Workflow Components</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-2 pt-2">
              <TabsList className="grid w-full grid-cols-3 h-9 p-0.5">
                {tabConfig.map(tab => {
                  const TabIcon = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.value}
                      value={tab.value} 
                      className="text-xs font-medium gap-0.5"
                    >
                      <TabIcon size={10} />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            
            <div className="mt-3 px-4 pb-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {tabConfig.map(tab => (
                <TabsContent key={tab.value} value={tab.value} className="m-0">
                  {renderNodeGrid(tab.items, tab.value)}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Workflow Guide */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={14} />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-blue-900">
                Build Your Workflow
              </p>
              <ol className="space-y-1 text-xs text-blue-700">
                <li>1. Start with one <span className="font-semibold text-blue-800">trigger</span></li>
                <li>2. Add <span className="font-semibold text-blue-800">conditions</span> for branching</li>
                <li>3. End with <span className="font-semibold text-blue-800">actions</span></li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}