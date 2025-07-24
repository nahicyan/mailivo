'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  subtype: string;
  title: string;
  description: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface NodeEditorProps {
  node: WorkflowNode;
  onChange: (updatedNode: WorkflowNode) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function NodeEditor({ node, onChange, onSave, onCancel }: NodeEditorProps) {
  const handleConfigChange = (key: string, value: any) => {
    onChange({
      ...node,
      config: { ...node.config, [key]: value }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium">Title</Label>
        <Input
          value={node.title}
          onChange={(e) => onChange({ ...node, title: e.target.value })}
          placeholder="Node title"
          className="text-sm mt-1"
        />
      </div>
      
      <div>
        <Label className="text-xs font-medium">Description</Label>
        <Textarea
          value={node.description || ''}
          onChange={(e) => onChange({ ...node, description: e.target.value })}
          placeholder="Node description"
          className="text-sm min-h-[60px] mt-1"
        />
      </div>

      {/* Trigger Configurations */}
      {node.type === 'trigger' && renderTriggerConfig(node, handleConfigChange)}

      {/* Action Configurations */}
      {node.type === 'action' && renderActionConfig(node, handleConfigChange)}

      {/* Condition Configurations */}
      {node.type === 'condition' && renderConditionConfig(node, handleConfigChange)}

      <div className="flex gap-2 pt-2">
        <Button onClick={onSave} size="sm" className="flex-1">
          Save Changes
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function renderTriggerConfig(node: WorkflowNode, handleConfigChange: (key: string, value: any) => void) {
  switch (node.subtype) {
    case 'campaign_sent':
      return (
        <div>
          <Label className="text-xs font-medium">Campaign</Label>
          <Select onValueChange={(value) => handleConfigChange('campaignId', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="campaign1">Welcome Series</SelectItem>
              <SelectItem value="campaign2">Property Alerts</SelectItem>
              <SelectItem value="campaign3">Monthly Newsletter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );

    case 'email_opened':
      return (
        <>
          <div>
            <Label className="text-xs font-medium">Campaign</Label>
            <Select onValueChange={(value) => handleConfigChange('campaignId', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="campaign1">Welcome Series</SelectItem>
                <SelectItem value="campaign2">Property Alerts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">Timeframe (hours)</Label>
            <Input
              type="number"
              value={node.config?.timeframe || 24}
              onChange={(e) => handleConfigChange('timeframe', parseInt(e.target.value))}
              placeholder="24"
              className="mt-1"
            />
          </div>
        </>
      );

    case 'date_trigger':
      return (
        <>
          <div>
            <Label className="text-xs font-medium">Schedule</Label>
            <Select onValueChange={(value) => handleConfigChange('schedule', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Once</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">Time</Label>
            <Input
              type="time"
              value={node.config?.time || '09:00'}
              onChange={(e) => handleConfigChange('time', e.target.value)}
              className="mt-1"
            />
          </div>
        </>
      );

    default:
      return null;
  }
}

function renderActionConfig(node: WorkflowNode, handleConfigChange: (key: string, value: any) => void) {
  switch (node.subtype) {
    case 'send_email':
      return (
        <>
          <div>
            <Label className="text-xs font-medium">Email Template</Label>
            <Select onValueChange={(value) => handleConfigChange('templateId', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Welcome Email</SelectItem>
                <SelectItem value="followup">Follow-up Email</SelectItem>
                <SelectItem value="promo">Promotional Email</SelectItem>
                <SelectItem value="property_alert">Property Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs font-medium">Delay (hours)</Label>
            <Input
              type="number"
              value={node.config?.delay || 0}
              onChange={(e) => handleConfigChange('delay', parseInt(e.target.value))}
              placeholder="0"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-medium">Subject Line</Label>
            <Input
              value={node.config?.subject || ''}
              onChange={(e) => handleConfigChange('subject', e.target.value)}
              placeholder="Email subject"
              className="mt-1"
            />
          </div>
        </>
      );

    case 'wait':
      return (
        <>
          <div>
            <Label className="text-xs font-medium">Duration</Label>
            <Input
              type="number"
              value={node.config?.duration || 1}
              onChange={(e) => handleConfigChange('duration', parseInt(e.target.value))}
              placeholder="1"
              className="mt-1"
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
        </>
      );

    case 'add_to_list':
    case 'remove_from_list':
      return (
        <div>
          <Label className="text-xs font-medium">Email List</Label>
          <Select onValueChange={(value) => handleConfigChange('listId', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select list" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list1">Newsletter Subscribers</SelectItem>
              <SelectItem value="list2">Property Leads</SelectItem>
              <SelectItem value="list3">VIP Clients</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );

    default:
      return null;
  }
}

function renderConditionConfig(node: WorkflowNode, handleConfigChange: (key: string, value: any) => void) {
  return (
    <>
      <div>
        <Label className="text-xs font-medium">Condition Type</Label>
        <Select onValueChange={(value) => handleConfigChange('conditionType', value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email_status">Email Status</SelectItem>
            <SelectItem value="contact_property">Contact Property</SelectItem>
            <SelectItem value="time_elapsed">Time Elapsed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {node.config?.conditionType === 'email_status' && (
        <>
          <div>
            <Label className="text-xs font-medium">Email Status</Label>
            <Select onValueChange={(value) => handleConfigChange('status', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="not_opened">Not Opened</SelectItem>
                <SelectItem value="clicked">Clicked</SelectItem>
                <SelectItem value="not_clicked">Not Clicked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">Within (hours)</Label>
            <Input
              type="number"
              value={node.config?.timeframe || 24}
              onChange={(e) => handleConfigChange('timeframe', parseInt(e.target.value))}
              placeholder="24"
              className="mt-1"
            />
          </div>
        </>
      )}
    </>
  );
}