'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';
import { workflowAPI } from '@/services/workflowAPI';

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

interface WorkflowStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgExecutionTime: number;
  conversionRate: number;
}

interface WorkflowExecution {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: string;
  completedAt?: string;
  contactId: string;
}

interface WorkflowStatsProps {
  workflow: Workflow;
}

export default function WorkflowStats({ workflow }: WorkflowStatsProps) {
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const triggerCount = workflow.nodes.filter(n => n.type === 'trigger').length;
  const actionCount = workflow.nodes.filter(n => n.type === 'action').length;
  const conditionCount = workflow.nodes.filter(n => n.type === 'condition').length;

  useEffect(() => {
    if (workflow.id) {
      loadWorkflowStats();
      loadRecentExecutions();
    }
  }, [workflow.id]);

  const loadWorkflowStats = async () => {
    try {
      const statsData = await workflowAPI.getWorkflowStats(workflow.id);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load workflow stats:', error);
      // Set default empty stats if API fails
      setStats({
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        avgExecutionTime: 0,
        conversionRate: 0
      });
    }
  };

  const loadRecentExecutions = async () => {
    try {
      const executionsData = await workflowAPI.getWorkflowExecutions(workflow.id, { limit: 5 });
      setExecutions(executionsData.executions || []);
    } catch (error) {
      console.error('Failed to load executions:', error);
      setExecutions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const successRate = stats ? 
    stats.totalRuns > 0 ? ((stats.successfulRuns / stats.totalRuns) * 100).toFixed(1) : '0' 
    : '0';

  const formatExecutionTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: 'default' as const, className: 'bg-green-100 text-green-800', label: 'Success' },
      failed: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800', label: 'Failed' },
      running: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800', label: 'Running' },
      paused: { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800', label: 'Paused' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.failed;
    return (
      <Badge variant={config.variant} className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-600" />
            Workflow Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{workflow.nodes.length}</div>
              <div className="text-xs text-gray-600">Total Nodes</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{triggerCount}</div>
              <div className="text-xs text-gray-600">Triggers</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{actionCount}</div>
              <div className="text-xs text-gray-600">Actions</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{conditionCount}</div>
              <div className="text-xs text-gray-600">Conditions</div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Status</span>
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
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity size={18} className="text-green-600" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {stats && stats.totalRuns > 0 ? (
            <>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Success Rate</span>
                  <span className="font-bold text-lg">{successRate}%</span>
                </div>
                <Progress value={parseFloat(successRate)} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-2">
                    <CheckCircle size={20} />
                    <span className="font-bold text-xl">{stats.successfulRuns}</span>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Successful</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center justify-center gap-1 text-red-600 mb-2">
                    <AlertCircle size={20} />
                    <span className="font-bold text-xl">{stats.failedRuns}</span>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Failed</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Users size={16} />
                    Total Executions
                  </span>
                  <span className="font-bold text-lg">{stats.totalRuns.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock size={16} />
                    Avg. Execution Time
                  </span>
                  <span className="font-bold text-lg">{formatExecutionTime(stats.avgExecutionTime)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Conversion Rate
                  </span>
                  <span className="font-bold text-lg text-green-600">{stats.conversionRate.toFixed(1)}%</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Target size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No execution data yet</p>
              <p className="text-sm text-gray-400">Activate your workflow to start collecting metrics</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar size={18} className="text-purple-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map((execution, index) => (
                <div key={execution.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(execution.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="text-xs text-gray-500">Contact: {execution.contactId}</span>
                  </div>
                  {getStatusBadge(execution.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No recent activity</p>
              <p className="text-sm text-gray-400">Execute your workflow to see activity here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Validation</CardTitle>
        </CardHeader>
        <CardContent>
          {workflow.nodes.length === 0 ? (
            <div className="text-sm text-amber-600 flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle size={16} />
              <span>Add nodes to start building your workflow</span>
            </div>
          ) : triggerCount === 0 ? (
            <div className="text-sm text-amber-600 flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle size={16} />
              <span>Add a trigger to activate this workflow</span>
            </div>
          ) : actionCount === 0 ? (
            <div className="text-sm text-amber-600 flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle size={16} />
              <span>Add at least one action</span>
            </div>
          ) : (
            <div className="text-sm text-green-600 flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle size={16} />
              <span>Workflow is ready to activate</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}