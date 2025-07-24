'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  GripVertical,
  Zap,
  Target,
  Filter,
  Mail,
  Clock,
  Users,
  Eye,
  MousePointer,
  Calendar,
  Send,
  Trash2
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
  onDelete: (nodeId: string) => void;
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

  return (
    <Card className={`w-72 shadow-lg border-2 ${isConnecting ? 'border-blue-300 cursor-pointer' : 'border-gray-200'} transition-all hover:shadow-xl`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getNodeColor(node.type, node.subtype)} text-white`}>
              <IconComponent size={16} />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{node.title}</CardTitle>
              <Badge variant="outline" className="text-xs mt-1">
                {node.type}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Settings size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(node.id)}
              className="text-red-500 hover:text-red-700"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {isEditing ? (
          <NodeEditor 
            node={nodeData} 
            onChange={setNodeData}
            onSave={handleSave}
          />
        ) : (
          <NodeDisplay node={node} />
        )}
        
        {/* Connection points */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="w-3 h-3 rounded-full bg-gray-300 cursor-pointer hover:bg-blue-500 transition-colors" />
          <GripVertical size={16} className="text-gray-400" />
          <div 
            className="w-3 h-3 rounded-full bg-gray-300 cursor-pointer hover:bg-blue-500 transition-colors"
            onClick={onConnect}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function NodeDisplay({ node }: { node: WorkflowNode }) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">
        {node.description || 'No description set'}
      </div>
      {node.config && Object.keys(node.config).length > 0 && (
        <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
          {Object.entries(node.config).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="font-medium">{key}:</span>
              <span>{String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}