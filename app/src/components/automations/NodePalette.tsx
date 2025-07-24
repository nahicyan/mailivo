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
  Filter 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NodePaletteProps {
  onAddNode: (type: string, subtype: string, title: string) => void;
}

const TRIGGER_TYPES = [
  { id: 'campaign_sent', label: 'Campaign Sent', icon: Mail, color: 'bg-blue-500' },
  { id: 'email_opened', label: 'Email Opened', icon: Eye, color: 'bg-green-500' },
  { id: 'link_clicked', label: 'Link Clicked', icon: MousePointer, color: 'bg-purple-500' },
  { id: 'contact_added', label: 'Contact Added', icon: Users, color: 'bg-orange-500' },
  { id: 'date_trigger', label: 'Date/Time', icon: Calendar, color: 'bg-red-500' },
];

const ACTION_TYPES = [
  { id: 'send_email', label: 'Send Email', icon: Send, color: 'bg-blue-500' },
  { id: 'add_to_list', label: 'Add to List', icon: Users, color: 'bg-green-500' },
  { id: 'remove_from_list', label: 'Remove from List', icon: Trash2, color: 'bg-red-500' },
  { id: 'update_contact', label: 'Update Contact', icon: Settings, color: 'bg-purple-500' },
  { id: 'wait', label: 'Wait/Delay', icon: Clock, color: 'bg-yellow-500' },
];

const CONDITION_TYPES = [
  { id: 'email_status', label: 'Email Status', icon: Filter, color: 'bg-indigo-500' },
  { id: 'contact_property', label: 'Contact Property', icon: Filter, color: 'bg-indigo-500' },
  { id: 'time_elapsed', label: 'Time Elapsed', icon: Filter, color: 'bg-indigo-500' },
];

export default function NodePalette({ onAddNode }: NodePaletteProps) {
  const [activeTab, setActiveTab] = useState('triggers');
  
  const tabs = [
    { id: 'triggers', label: 'Triggers', items: TRIGGER_TYPES },
    { id: 'actions', label: 'Actions', items: ACTION_TYPES },
    { id: 'conditions', label: 'Conditions', items: CONDITION_TYPES },
  ];

  return (
    <Card className="w-full h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Workflow Elements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-1 mb-4">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex-1"
            >
              {tab.label}
            </Button>
          ))}
        </div>
        
        <div className="space-y-2">
          {tabs.find(tab => tab.id === activeTab)?.items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onAddNode(activeTab.slice(0, -1), item.id, item.label)}
            >
              {item.icon && (
                <div className={`p-1 rounded ${item.color} text-white`}>
                  <item.icon size={14} />
                </div>
              )}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Quick Start Templates */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Quick Start Templates</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                // Add welcome series template
                onAddNode('trigger', 'contact_added', 'Contact Added');
                setTimeout(() => onAddNode('action', 'send_email', 'Welcome Email'), 100);
                setTimeout(() => onAddNode('action', 'wait', 'Wait 3 Days'), 200);
                setTimeout(() => onAddNode('action', 'send_email', 'Follow-up Email'), 300);
              }}
            >
              🎯 Welcome Series
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                // Add re-engagement template
                onAddNode('trigger', 'email_opened', 'Email Not Opened');
                setTimeout(() => onAddNode('condition', 'time_elapsed', 'After 7 Days'), 100);
                setTimeout(() => onAddNode('action', 'send_email', 'Re-engagement Email'), 200);
              }}
            >
              🔄 Re-engagement
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                // Add property follow-up template
                onAddNode('trigger', 'campaign_sent', 'Property Alert Sent');
                setTimeout(() => onAddNode('condition', 'email_status', 'Email Opened?'), 100);
                setTimeout(() => onAddNode('action', 'send_email', 'Property Follow-up'), 200);
              }}
            >
              🏠 Property Follow-up
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                // Add nurture sequence template
                onAddNode('trigger', 'contact_added', 'New Lead');
                setTimeout(() => onAddNode('action', 'send_email', 'Welcome & Info'), 100);
                setTimeout(() => onAddNode('action', 'wait', 'Wait 5 Days'), 200);
                setTimeout(() => onAddNode('condition', 'email_status', 'Engaged?'), 300);
                setTimeout(() => onAddNode('action', 'send_email', 'Property Recommendations'), 400);
              }}
            >
              🌱 Nurture Sequence
            </Button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">💡 Tips</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Start with a trigger to define when your workflow begins</p>
            <p>• Use conditions to create smart branching logic</p>
            <p>• Add wait actions to control timing between emails</p>
            <p>• Test workflows with small segments first</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}