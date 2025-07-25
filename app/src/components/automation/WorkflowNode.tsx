'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Mail, 
  Clock, 
  Users, 
  Eye, 
  MousePointer, 
  Calendar, 
  Send, 
  Trash2, 
  Filter,
  Zap,
  Target,
  Home,
  Heart,
  ShoppingCart,
  Timer,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  ArrowRight,
  ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { WorkflowNode as WorkflowNodeType, DelayConfig } from '@mailivo/shared-types';

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  onUpdate: (updatedNode: WorkflowNodeType) => void;
  onDelete: () => void;
  onConnect: (outputType?: 'yes' | 'no' | 'default') => void;
  isConnecting: boolean;
  validationErrors?: string[];
  isExecuting?: boolean;
  executionStatus?: 'pending' | 'running' | 'completed' | 'failed';
}

const NODE_ICONS = {
  // Triggers
  contact_added: Users,
  campaign_sent: Mail,
  email_opened: Eye,
  email_not_opened: Eye,
  link_clicked: MousePointer,
  property_viewed: Home,
  new_property_match: Heart,
  cart_abandoned: ShoppingCart,
  
  // Actions
  send_email: Send,
  send_property_alert: Home,
  add_to_list: Users,
  remove_from_list: Trash2,
  update_contact: Settings,
  wait: Timer,
  score_lead: Target,
  
  // Conditions
  email_status: CheckCircle,
  engagement_score: Target,
  contact_property: Filter,
  list_membership: Users,
  property_interest: Home,
  purchase_history: ShoppingCart,
};

const NODE_COLORS = {
  trigger: 'bg-blue-500',
  action: 'bg-green-500',
  condition: 'bg-yellow-500',
  wait: 'bg-purple-500',
};

export default function WorkflowNode({ 
  node, 
  onUpdate, 
  onDelete, 
  onConnect,
  isConnecting,
  validationErrors = [],
  isExecuting = false,
  executionStatus = 'pending'
}: WorkflowNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeData, setNodeData] = useState(node);

  const Icon = NODE_ICONS[node.subtype as keyof typeof NODE_ICONS] || Zap;
  const hasErrors = validationErrors.length > 0;
  const isCondition = node.type === 'condition';

  const handleConfigChange = (key: string, value: any) => {
    const updatedNode = {
      ...nodeData,
      config: { ...nodeData.config, [key]: value },
      updatedAt: new Date()
    };
    setNodeData(updatedNode);
  };

  const handleSave = () => {
    onUpdate(nodeData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNodeData(node);
    setIsEditing(false);
  };

  const getExecutionStatusColor = () => {
    switch (executionStatus) {
      case 'running': return 'border-blue-500 bg-blue-50';
      case 'completed': return 'border-green-500 bg-green-50';
      case 'failed': return 'border-red-500 bg-red-50';
      default: return '';
    }
  };

  const renderConfigEditor = () => {
    switch (node.subtype) {
      case 'send_email':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Email Template</Label>
              <Select onValueChange={(value) => handleConfigChange('templateId', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select email template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome Email</SelectItem>
                  <SelectItem value="followup">Follow-up Email</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotion">Promotional Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium">Campaign Type</Label>
              <Select onValueChange={(value) => handleConfigChange('campaignType', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Delay Duration</Label>
                <Input
                  type="number"
                  value={nodeData.config?.delay?.duration || 0}
                  onChange={(e) => handleConfigChange('delay', {
                    ...nodeData.config?.delay,
                    duration: parseInt(e.target.value)
                  })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Unit</Label>
                <Select onValueChange={(value) => handleConfigChange('delay', {
                  ...nodeData.config?.delay,
                  unit: value
                })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'send_property_alert':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Property Alert Template</Label>
              <Select onValueChange={(value) => handleConfigChange('templateId', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_listing">New Listing Alert</SelectItem>
                  <SelectItem value="price_drop">Price Drop Alert</SelectItem>
                  <SelectItem value="open_house">Open House Invitation</SelectItem>
                  <SelectItem value="market_update">Market Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium">Max Properties per Email</Label>
              <Input
                type="number"
                value={nodeData.config?.maxProperties || 5}
                onChange={(e) => handleConfigChange('maxProperties', parseInt(e.target.value))}
                placeholder="5"
                className="mt-1"
                min="1"
                max="20"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={nodeData.config?.includeImages || false}
                onCheckedChange={(checked) => handleConfigChange('includeImages', checked)}
              />
              <Label className="text-xs font-medium">Include Property Images</Label>
            </div>
          </div>
        );

      case 'wait':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Duration</Label>
                <Input
                  type="number"
                  value={nodeData.config?.duration || 1}
                  onChange={(e) => handleConfigChange('duration', parseInt(e.target.value))}
                  placeholder="1"
                  className="mt-1"
                  min="1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Unit</Label>
                <Select onValueChange={(value) => handleConfigChange('unit', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-700">
                💡 <strong>Tip:</strong> Use wait nodes to space out your emails and avoid overwhelming subscribers.
              </p>
            </div>
          </div>
        );

      case 'email_status':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Email Status</Label>
              <Select onValueChange={(value) => handleConfigChange('status', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status to check" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opened">Email Opened</SelectItem>
                  <SelectItem value="not_opened">Email Not Opened</SelectItem>
                  <SelectItem value="clicked">Link Clicked</SelectItem>
                  <SelectItem value="not_clicked">Link Not Clicked</SelectItem>
                  <SelectItem value="bounced">Email Bounced</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium">Timeframe (hours)</Label>
              <Input
                type="number"
                value={nodeData.config?.timeframe || 24}
                onChange={(e) => handleConfigChange('timeframe', parseInt(e.target.value))}
                placeholder="24"
                className="mt-1"
                min="1"
                max="168"
              />
              <p className="text-xs text-gray-500 mt-1">
                How long to wait before checking status
              </p>
            </div>

            <div>
              <Label className="text-xs font-medium">Campaign (Optional)</Label>
              <Select onValueChange={(value) => handleConfigChange('campaignId', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Campaign</SelectItem>
                  <SelectItem value="welcome">Welcome Series</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotion">Promotional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'contact_property':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Contact Field</Label>
              <Select onValueChange={(value) => handleConfigChange('field', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="firstName">First Name</SelectItem>
                  <SelectItem value="lastName">Last Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="leadScore">Lead Score</SelectItem>
                  <SelectItem value="tags">Tags</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium">Condition</Label>
              <Select onValueChange={(value) => handleConfigChange('operator', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="not_contains">Does Not Contain</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                  <SelectItem value="exists">Exists</SelectItem>
                  <SelectItem value="not_exists">Does Not Exist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Value</Label>
              <Input
                value={nodeData.config?.value || ''}
                onChange={(e) => handleConfigChange('value', e.target.value)}
                placeholder="Enter value to compare"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'add_to_list':
      case 'remove_from_list':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Email List</Label>
              <Select onValueChange={(value) => handleConfigChange('listId', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select list" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscribers">Main Subscribers</SelectItem>
                  <SelectItem value="prospects">Prospects</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="vip">VIP Members</SelectItem>
                  <SelectItem value="buyers">Property Buyers</SelectItem>
                  <SelectItem value="sellers">Property Sellers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {node.subtype === 'add_to_list' && (
              <div>
                <Label className="text-xs font-medium">Tags to Add (Optional)</Label>
                <Input
                  value={nodeData.config?.tags?.join(', ') || ''}
                  onChange={(e) => handleConfigChange('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                  placeholder="tag1, tag2, tag3"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple tags with commas
                </p>
              </div>
            )}
          </div>
        );

      case 'new_property_match':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Buyer Segment</Label>
              <Select onValueChange={(value) => handleConfigChange('segmentId', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select buyer segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manhattan_buyers">Manhattan Buyers</SelectItem>
                  <SelectItem value="brooklyn_buyers">Brooklyn Buyers</SelectItem>
                  <SelectItem value="luxury_buyers">Luxury Property Buyers</SelectItem>
                  <SelectItem value="first_time_buyers">First-time Buyers</SelectItem>
                  <SelectItem value="investment_buyers">Investment Buyers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium">Property Type</Label>
              <Select onValueChange={(value) => handleConfigChange('criteria', {
                ...nodeData.config?.criteria,
                propertyType: [value]
              })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Min Price</Label>
                <Input
                  type="number"
                  value={nodeData.config?.criteria?.priceRange?.min || ''}
                  onChange={(e) => handleConfigChange('criteria', {
                    ...nodeData.config?.criteria,
                    priceRange: {
                      ...nodeData.config?.criteria?.priceRange,
                      min: parseInt(e.target.value) || 0
                    }
                  })}
                  placeholder="500000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Max Price</Label>
                <Input
                  type="number"
                  value={nodeData.config?.criteria?.priceRange?.max || ''}
                  onChange={(e) => handleConfigChange('criteria', {
                    ...nodeData.config?.criteria,
                    priceRange: {
                      ...nodeData.config?.criteria?.priceRange,
                      max: parseInt(e.target.value) || 999999999
                    }
                  })}
                  placeholder="1000000"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Configuration</Label>
              <Textarea
                value={JSON.stringify(nodeData.config, null, 2)}
                onChange={(e) => {
                  try {
                    const config = JSON.parse(e.target.value);
                    setNodeData({ ...nodeData, config });
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder="Enter configuration as JSON"
                className="mt-1 font-mono text-xs"
                rows={6}
              />
            </div>
          </div>
        );
    }
  };

  if (isEditing) {
    return (
      <Card className="w-80 border-2 border-blue-500 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${NODE_COLORS[node.type]} text-white`}>
                <Icon size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">{node.title}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {node.type}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {renderConfigEditor()}
          
          <div className="flex space-x-2 mt-6">
            <Button onClick={handleSave} size="sm" className="flex-1">
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-64 transition-all duration-200 hover:shadow-md ${
      hasErrors ? 'border-red-500 bg-red-50' : ''
    } ${isExecuting ? getExecutionStatusColor() : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${NODE_COLORS[node.type]} text-white relative`}>
              <Icon size={16} />
              {isExecuting && executionStatus === 'running' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-900">{node.title}</h4>
              <Badge variant="outline" className="text-xs">
                {node.type}
              </Badge>
            </div>
          </div>
          
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0"
            >
              <Settings size={12} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <X size={12} />
            </Button>
          </div>
        </div>

        {/* Node Configuration Summary */}
        <div className="text-xs text-gray-600 mb-3 space-y-1">
          {node.subtype === 'send_email' && node.config?.templateId && (
            <div>Template: {node.config.templateId}</div>
          )}
          {node.subtype === 'wait' && (
            <div>Wait: {node.config?.duration || 1} {node.config?.unit || 'hours'}</div>
          )}
          {node.subtype === 'email_status' && (
            <div>Check: {node.config?.status} within {node.config?.timeframe || 24}h</div>
          )}
          {node.subtype === 'add_to_list' && node.config?.listId && (
            <div>Add to: {node.config.listId}</div>
          )}
        </div>

        {/* Validation Errors */}
        {hasErrors && (
          <div className="mb-3 p-2 bg-red-100 rounded-lg">
            <div className="flex items-center space-x-1 mb-1">
              <AlertTriangle size={12} className="text-red-500" />
              <span className="text-xs font-medium text-red-700">Configuration Issues:</span>
            </div>
            {validationErrors.map((error, index) => (
              <div key={index} className="text-xs text-red-600">• {error}</div>
            ))}
          </div>
        )}

        {/* Connection Points */}
        <div className="flex justify-between items-center">
          {/* Input connection point */}
          {node.type !== 'trigger' && (
            <div className="w-3 h-3 bg-gray-300 rounded-full border-2 border-white shadow-sm" />
          )}
          
          <div className="flex-1" />
          
          {/* Output connection points */}
          {isCondition ? (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConnect('yes')}
                className="h-6 px-2 text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                disabled={isConnecting}
              >
                Yes
              </Button>
              <Button
                variant="outline" 
                size="sm"
                onClick={() => onConnect('no')}
                className="h-6 px-2 text-xs bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                disabled={isConnecting}
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConnect('default')}
              className="h-6 w-6 p-0"
              disabled={isConnecting}
            >
              <ArrowRight size={12} />
            </Button>
          )}
        </div>

        {/* Execution Status */}
        {isExecuting && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center space-x-2">
              {executionStatus === 'running' && <Play size={12} className="text-blue-500" />}
              {executionStatus === 'completed' && <CheckCircle size={12} className="text-green-500" />}
              {executionStatus === 'failed' && <AlertTriangle size={12} className="text-red-500" />}
              <span className="text-xs font-medium capitalize">{executionStatus}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}