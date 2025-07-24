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
  Zap 
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

  const handleAddNode = (type: string, item: any) => {
    onAddNode(type.slice(0, -1), item.id, item.label);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Workflow Elements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-1 mb-4">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 text-xs"
              >
                {tab.label}
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            {tabs.find(tab => tab.id === activeTab)?.items.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
                onClick={() => handleAddNode(activeTab, item)}
              >
                <div className={`p-2 rounded ${item.color} text-white group-hover:scale-110 transition-transform`}>
                  <item.icon size={16} />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Templates */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Start Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs h-auto p-3"
              onClick={() => {
                onAddNode('trigger', 'contact_added', 'Contact Added');
                setTimeout(() => onAddNode('action', 'send_email', 'Welcome Email'), 100);
                setTimeout(() => onAddNode('action', 'wait', 'Wait 3 Days'), 200);
                setTimeout(() => onAddNode('action', 'send_email', 'Follow-up Email'), 300);
              }}
            >
              <div className="text-left">
                <div className="font-medium">🎯 Welcome Series</div>
                <div className="text-gray-500">New contact → Welcome → Wait → Follow-up</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs h-auto p-3"
              onClick={() => {
                onAddNode('trigger', 'email_opened', 'Email Not Opened');
                setTimeout(() => onAddNode('condition', 'time_elapsed', 'After 7 Days'), 100);
                setTimeout(() => onAddNode('action', 'send_email', 'Re-engagement Email'), 200);
              }}
            >
              <div className="text-left">
                <div className="font-medium">🔄 Re-engagement</div>
                <div className="text-gray-500">Not opened → Wait → Re-engage</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs h-auto p-3"
              onClick={() => {
                onAddNode('trigger', 'campaign_sent', 'Property Alert Sent');
                setTimeout(() => onAddNode('condition', 'email_status', 'Email Opened?'), 100);
                setTimeout(() => onAddNode('action', 'send_email', 'Property Follow-up'), 200);
              }}
            >
              <div className="text-left">
                <div className="font-medium">🏠 Property Follow-up</div>
                <div className="text-gray-500">Alert sent → Check opened → Follow-up</div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs h-auto p-3"
              onClick={() => {
                onAddNode('trigger', 'contact_added', 'New Lead');
                setTimeout(() => onAddNode('action', 'send_email', 'Welcome & Info'), 100);
                setTimeout(() => onAddNode('action', 'wait', 'Wait 5 Days'), 200);
                setTimeout(() => onAddNode('condition', 'email_status', 'Engaged?'), 300);
                setTimeout(() => onAddNode('action', 'send_email', 'Property Recommendations'), 400);
              }}
            >
              <div className="text-left">
                <div className="font-medium">🌱 Nurture Sequence</div>
                <div className="text-gray-500">Lead → Welcome → Wait → Check → Nurture</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="border-0 shadow-sm bg-blue-50 border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            💡 <span>Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700 space-y-2">
            <p>• Start with a trigger to define when your workflow begins</p>
            <p>• Use conditions to create smart branching logic</p>
            <p>• Add wait actions to control timing between emails</p>
            <p>• Test workflows with small segments first</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}