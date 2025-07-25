'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface WorkflowAnalytics {
  overview: {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
    avgExecutionTime: number;
    uniqueContacts: number;
    conversionRate: number;
    emailsSent: number;
  };
  performance: {
    executionTrends: Array<{
      date: string;
      executions: number;
      successes: number;
      failures: number;
      successRate: number;
    }>;
    topPerformingWorkflows: Array<{
      id: string;
      name: string;
      executions: number;
      successRate: number;
      conversionRate: number;
      avgDuration: number;
    }>;
    nodePerformance: Array<{
      nodeType: string;
      executions: number;
      successes: number;
      failures: number;
      avgDuration: number;
    }>;
  };
  engagement: {
    emailMetrics: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      unsubscribed: number;
    };
    engagementTrends: Array<{
      date: string;
      opens: number;
      clicks: number;
      openRate: number;
      clickRate: number;
    }>;
    deviceBreakdown: Array<{
      device: string;
      count: number;
      percentage: number;
    }>;
  };
  conversions: {
    totalConversions: number;
    conversionValue: number;
    conversionsByType: Array<{
      type: string;
      count: number;
      value: number;
    }>;
    conversionFunnel: Array<{
      stage: string;
      count: number;
      conversionRate: number;
    }>;
  };
}

interface WorkflowAnalyticsProps {
  workflowId?: string;
  dateRange?: { start: Date; end: Date };
}

export function WorkflowAnalyticsDashboard({ workflowId, dateRange }: WorkflowAnalyticsProps) {
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [workflowId, selectedPeriod, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('period', selectedPeriod);
      if (workflowId) params.append('workflowId', workflowId);
      if (dateRange) {
        params.append('startDate', dateRange.start.toISOString());
        params.append('endDate', dateRange.end.toISOString());
      }

      const response = await fetch(`/api/workflows/analytics?${params}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return (num || 0).toFixed(1) + '%';
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const renderOverviewCards = () => {
    if (!analytics) return null;

    const cards = [
      {
        title: 'Total Executions',
        value: formatNumber(analytics.overview.totalExecutions),
        icon: Play,
        color: 'text-blue-500',
        change: '+12.5%'
      },
      {
        title: 'Success Rate',
        value: formatPercentage(analytics.overview.successRate),
        icon: CheckCircle,
        color: 'text-green-500',
        change: '+2.1%'
      },
      {
        title: 'Avg Execution Time',
        value: formatDuration(analytics.overview.avgExecutionTime),
        icon: Clock,
        color: 'text-purple-500',
        change: '-8.3%'
      },
      {
        title: 'Unique Contacts',
        value: formatNumber(analytics.overview.uniqueContacts),
        icon: Users,
        color: 'text-orange-500',
        change: '+18.7%'
      },
      {
        title: 'Conversion Rate',
        value: formatPercentage(analytics.overview.conversionRate),
        icon: Target,
        color: 'text-red-500',
        change: '+5.2%'
      },
      {
        title: 'Emails Sent',
        value: formatNumber(analytics.overview.emailsSent),
        icon: Mail,
        color: 'text-indigo-500',
        change: '+23.1%'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const isPositive = card.change.startsWith('+');
          
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                    <div className="flex items-center mt-2">
                      {isPositive ? (
                        <TrendingUp className="text-green-500 mr-1" size={16} />
                      ) : (
                        <TrendingDown className="text-red-500 mr-1" size={16} />
                      )}
                      <span className={`text-sm font-medium ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs last period</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg bg-gray-50`}>
                    <Icon className={card.color} size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderPerformanceCharts = () => {
    if (!analytics?.performance) return null;

    return (
      <div className="space-y-6">
        {/* Execution Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.performance.executionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="executions" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="successes" 
                  stackId="2"
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="failures" 
                  stackId="2"
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Workflows */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.performance.topPerformingWorkflows.map((workflow, index) => (
                <div key={workflow.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>{formatNumber(workflow.executions)} executions</span>
                      <span>{formatPercentage(workflow.successRate)} success</span>
                      <span>{formatPercentage(workflow.conversionRate)} conversion</span>
                      <span>{formatDuration(workflow.avgDuration)} avg time</span>
                    </div>
                  </div>
                  <Badge variant="outline">#{index + 1}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Node Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Node Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.performance.nodePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nodeType" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="successes" fill="#10b981" />
                <Bar dataKey="failures" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderEngagementMetrics = () => {
    if (!analytics?.engagement) return null;

    const emailMetrics = analytics.engagement.emailMetrics;
    const deliveryRate = (emailMetrics.delivered / emailMetrics.sent) * 100;
    const openRate = (emailMetrics.opened / emailMetrics.delivered) * 100;
    const clickRate = (emailMetrics.clicked / emailMetrics.opened) * 100;
    const bounceRate = (emailMetrics.bounced / emailMetrics.sent) * 100;

    const pieData = [
      { name: 'Opened', value: emailMetrics.opened, color: '#10b981' },
      { name: 'Clicked', value: emailMetrics.clicked, color: '#3b82f6' },
      { name: 'Bounced', value: emailMetrics.bounced, color: '#ef4444' },
      { name: 'Unsubscribed', value: emailMetrics.unsubscribed, color: '#f59e0b' },
    ];

    return (
      <div className="space-y-6">
        {/* Email Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(deliveryRate)}</p>
                <p className="text-sm text-gray-600">Delivery Rate</p>
                <Progress value={deliveryRate} className="mt-2" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{formatPercentage(openRate)}</p>
                <p className="text-sm text-gray-600">Open Rate</p>
                <Progress value={openRate} className="mt-2" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{formatPercentage(clickRate)}</p>
                <p className="text-sm text-gray-600">Click Rate</p>
                <Progress value={clickRate} className="mt-2" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{formatPercentage(bounceRate)}</p>
                <p className="text-sm text-gray-600">Bounce Rate</p>
                <Progress value={bounceRate} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.engagement.engagementTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="openRate" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="clickRate" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Email Engagement Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Engagement Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.engagement.deviceBreakdown.map((device, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{device.device}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={device.percentage} className="w-20" />
                      <span className="text-sm text-gray-600">{formatPercentage(device.percentage)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderConversions = () => {
    if (!analytics?.conversions) return null;

    return (
      <div className="space-y-6">
        {/* Conversion Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="mx-auto mb-4 text-green-500" size={48} />
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(analytics.conversions.totalConversions)}
              </p>
              <p className="text-sm text-gray-600">Total Conversions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="mx-auto mb-4 text-blue-500" size={48} />
              <p className="text-3xl font-bold text-gray-900">
                ${formatNumber(analytics.conversions.conversionValue)}
              </p>
              <p className="text-sm text-gray-600">Conversion Value</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="mx-auto mb-4 text-purple-500" size={48} />
              <p className="text-3xl font-bold text-gray-900">
                {formatPercentage(analytics.overview.conversionRate)}
              </p>
              <p className="text-sm text-gray-600">Conversion Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Conversions by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Conversions by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.conversions.conversionsByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.conversions.conversionFunnel.map((stage, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{stage.stage}</span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">
                        {formatNumber(stage.count)}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({formatPercentage(stage.conversionRate)})
                      </span>
                    </div>
                  </div>
                  <Progress value={stage.conversionRate} className="h-3" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {workflowId ? 'Workflow Analytics' : 'Analytics Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">
            Performance insights and metrics for your workflows
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          {renderPerformanceCharts()}
        </TabsContent>
        
        <TabsContent value="engagement" className="mt-6">
          {renderEngagementMetrics()}
        </TabsContent>
        
        <TabsContent value="conversions" className="mt-6">
          {renderConversions()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Individual metric components for reuse
export function WorkflowMetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'text-blue-500' 
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color?: string;
}) {
  const isPositive = change?.startsWith('+');
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className="flex items-center mt-2">
                {isPositive ? (
                  <TrendingUp className="text-green-500 mr-1" size={16} />
                ) : (
                  <TrendingDown className="text-red-500 mr-1" size={16} />
                )}
                <span className={`text-sm font-medium ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <Icon className={color} size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Real-time metrics component
export function RealtimeWorkflowMetrics() {
  const [metrics, setMetrics] = useState({
    activeExecutions: 0,
    queueSize: 0,
    throughput: 0,
    errorRate: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/workflows/metrics/realtime');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch realtime metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <WorkflowMetricCard
        title="Active Executions"
        value={metrics.activeExecutions}
        icon={Play}
        color="text-green-500"
      />
      <WorkflowMetricCard
        title="Queue Size"
        value={metrics.queueSize}
        icon={Clock}
        color="text-yellow-500"
      />
      <WorkflowMetricCard
        title="Throughput/min"
        value={metrics.throughput}
        icon={TrendingUp}
        color="text-blue-500"
      />
      <WorkflowMetricCard
        title="Error Rate"
        value={`${metrics.errorRate.toFixed(1)}%`}
        icon={AlertTriangle}
        color="text-red-500"
      />
    </div>
  );
}