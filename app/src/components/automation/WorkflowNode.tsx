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
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NodeEditor from './NodeEditor';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  subtype: string;
  title: string;
  description: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface WorkflowNodeProps {
  node: WorkflowNode;
  onUpdate: (updatedNode: WorkflowNode) => void;
  onDelete: () => void;
  isConnecting: boolean;
  onConnect: () => void;
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

export default function WorkflowNode({ 
  node, 
  onUpdate, 
  onDelete, 
  isConnecting, 
  onConnect 
}: WorkflowNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeData, setNodeData] = useState(node);

  const getNodeIcon = (type: string, subtype: string) => {
    if (type === 'trigger') {
      const trigger = TRIGGER_TYPES.find(t => t.id === subtype);
      return trigger ? trigger.icon : Zap;
    }
    if (type === 'action') {
      const action = ACTION_TYPES.find(a => a.id === subtype);
      return action ? action.icon : Target;
    }
    return Filter;
  };

  const getNodeColor = (type: string, subtype: string) => {
    if (type === 'trigger') {
      const trigger = TRIGGER_TYPES.find(t => t.id === subtype);
      return trigger ? trigger.color : 'bg-gray-500';
    }
    if (type === 'action') {
      const action = ACTION_TYPES.find(a => a.id === subtype);
      return action ? action.color : 'bg-gray-500';
    }
    return 'bg-indigo-500';
  };

  const IconComponent = getNodeIcon(node.type, node.subtype);

  const handleSave = () => {
    onUpdate(nodeData);
    setIsEditing(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'bg-blue-100 text-blue-800';
      case 'action': return 'bg-green-100 text-green-800';
      case 'condition': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`w-80 shadow-lg border-2 ${isConnecting ? 'border-blue-300 cursor-pointer' : 'border-gray-200'} transition-all hover:shadow-xl bg-white`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getNodeColor(node.type, node.subtype)} text-white`}>
              <IconComponent size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold truncate">{node.title}</CardTitle>
              <Badge variant="outline" className={`text-xs mt-1 ${getTypeColor(node.type)}`}>
                {node.type}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 w-8 p-0"
            >
              <Settings size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isEditing ? (
          <NodeEditor 
            node={nodeData} 
            onChange={setNodeData}
            onSave={handleSave}
            onCancel={() => {
              setNodeData(node);
              setIsEditing(false);
            }}
          />
        ) : (
          <NodeDisplay node={node} />
        )}
      </CardContent>
    </Card>
  );
}

function NodeDisplay({ node }: { node: WorkflowNode }) {
  const formatConfigValue = (key: string, value: any) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        {node.description || 'No description set'}
      </div>
      
      {node.config && Object.keys(node.config).length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Configuration
          </h4>
          <div className="space-y-2">
            {Object.entries(node.config).map(([key, value]) => (
              <div key={key} className="flex justify-between items-start text-xs">
                <span className="font-medium text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="text-gray-900 text-right ml-2 break-words">
                  {formatConfigValue(key, value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}