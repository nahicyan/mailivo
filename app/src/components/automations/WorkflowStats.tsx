'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause 
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  subtype: string;
  title: string;
  description: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface WorkflowConnection {
  from: string;
  to: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

interface WorkflowStatsProps {
  workflow: Workflow;
}

export default function WorkflowStats({ workflow }: WorkflowStatsProps) {
  const triggerCount = workflow.nodes.filter(n => n.type === 'trigger').length;
  const actionCount = workflow.nodes.filter(n => n.type === 'action').length;
  const conditionCount = workflow.nodes.filter(n => n.type === 'condition').length;

  // Mock performance data - in real app this would come from API
  const mockStats = {
    totalExecutions: 1250,
    successfulExecutions: 1180,
    failedExecutions: 70,
    avgExecutionTime: 45, // seconds
    conversionRate: 24.5,
    lastExecuted: new Date('2024-01-20'),
    estimatedReach: 5000
  };

  const successRate = ((mockStats.successfulExecutions / mockStats.totalExecutions) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Workflow Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Nodes</span>
            <Badge variant="secondary">{workflow.nodes.length}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Triggers</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {triggerCount}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Actions</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {actionCount}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Conditions</span>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {conditionCount}
            </Badge>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Status</span>
            <Badge variant={workflow.isActive ? 'default' : 'secondary'} className="flex items-center gap-1">
              {workflow.isActive ? (
                <>
                  <Play size={12} />
                  Active
                </>
              ) : (
                <>
                  <Pause size={12} />
                  Draft
                </>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity size={18} />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-medium">{successRate}%</span>
            </div>
            <Progress value={parseFloat(successRate)} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <CheckCircle size={14} />
                <span className="font-medium">{mockStats.successfulExecutions}</span>
              </div>
              <div className="text-xs text-gray-600">Successful</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <AlertCircle size={14} />
                <span className="font-medium">{mockStats.failedExecutions}</span>
              </div>
              <div className="text-xs text-gray-600">Failed</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Users size={14} />
                Total Executions
              </span>
              <span className="font-medium">{mockStats.totalExecutions.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Clock size={14} />
                Avg. Execution Time
              </span>
              <span className="font-medium">{mockStats.avgExecutionTime}s</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <TrendingUp size={14} />
                Conversion Rate
              </span>
              <span className="font-medium text-green-600">{mockStats.conversionRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Executed</span>
              <span className="font-medium">
                {mockStats.lastExecuted.toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Estimated Reach</span>
              <span className="font-medium">
                {mockStats.estimatedReach.toLocaleString()} contacts
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Recent Executions</div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Jan 20, 2:30 PM</span>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Success</Badge>
              </div>
              <div className="flex justify-between">
                <span>Jan 20, 1:15 PM</span>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Success</Badge>
              </div>
              <div className="flex justify-between">
                <span>Jan 20, 12:00 PM</span>
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Failed</Badge>
              </div>
              <div className="flex justify-between">
                <span>Jan 19, 11:45 PM</span>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Success</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Validation</CardTitle>
        </CardHeader>
        <CardContent>
          {workflow.nodes.length === 0 ? (
            <div className="text-sm text-amber-600 flex items-center gap-2">
              <AlertCircle size={14} />
              Add nodes to start building your workflow
            </div>
          ) : triggerCount === 0 ? (
            <div className="text-sm text-amber-600 flex items-center gap-2">
              <AlertCircle size={14} />
              Add a trigger to activate this workflow
            </div>
          ) : actionCount === 0 ? (
            <div className="text-sm text-amber-600 flex items-center gap-2">
              <AlertCircle size={14} />
              Add at least one action
            </div>
          ) : (
            <div className="text-sm text-green-600 flex items-center gap-2">
              <CheckCircle size={14} />
              Workflow is ready to activate
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-gray-600">
          <p>• Test with a small segment before full deployment</p>
          <p>• Monitor open rates and adjust timing</p>
          <p>• Use A/B testing for email content</p>
          <p>• Add unsubscribe options in all emails</p>
          <p>• Review performance weekly</p>
        </CardContent>
      </Card>
    </div>
  );
}