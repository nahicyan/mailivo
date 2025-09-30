// app/src/components/automation/WorkflowMonitor.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  Mail
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface WorkflowMonitorProps {
  workflowId: string;
}

export default function WorkflowMonitor({ workflowId }: WorkflowMonitorProps) {
  const [executions, setExecutions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    running: 0,
    averageTime: 0,
    affectedRecords: 0
  });

  const { data: realtimeData } = useWebSocket(`/workflow/${workflowId}/monitor`);

  useEffect(() => {
    if (realtimeData) {
      handleRealtimeUpdate(realtimeData);
    }
  }, [realtimeData]);

  const handleRealtimeUpdate = (data: any) => {
    if (data.type === 'execution_started') {
      setExecutions(prev => [data.execution, ...prev].slice(0, 10));
      setStats(prev => ({
        ...prev,
        running: prev.running + 1,
        total: prev.total + 1
      }));
    } else if (data.type === 'execution_completed') {
      setExecutions(prev => 
        prev.map(e => e.id === data.executionId 
          ? { ...e, status: 'completed', ...data.result }
          : e
        )
      );
      setStats(prev => ({
        ...prev,
        running: Math.max(0, prev.running - 1),
        successful: prev.successful + 1,
        affectedRecords: prev.affectedRecords + data.result.affectedRecords
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <Progress value={100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 
                ? Math.round((stats.successful / stats.total) * 100) 
                : 0}%
            </div>
            <Progress 
              value={stats.total > 0 ? (stats.successful / stats.total) * 100 : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageTime}s</div>
            <p className="text-xs text-muted-foreground mt-2">
              Per execution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records Affected</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.affectedRecords}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Total contacts reached
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {executions.map((execution: any) => (
              <div 
                key={execution.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {execution.status === 'running' && (
                    <div className="animate-pulse">
                      <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                  )}
                  {execution.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {execution.status === 'failed' && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  
                  <div>
                    <p className="font-medium">Execution #{execution.id.slice(-8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(execution.startedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {execution.affectedRecords || 0} records
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {execution.executionTime || 0}ms
                    </p>
                  </div>
                  
                  <Badge 
                    variant={
                      execution.status === 'completed' ? 'success' :
                      execution.status === 'failed' ? 'destructive' :
                      'default'
                    }
                  >
                    {execution.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}