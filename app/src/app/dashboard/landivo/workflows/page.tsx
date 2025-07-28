'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit3,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Zap,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Workflow, WorkflowCategory, WORKFLOW_TEMPLATES } from '@mailivo/shared-types';
import { workflowAPI } from '@/services/workflowAPI';
import Link from 'next/link';


interface WorkflowWithHealth extends Workflow {
  validation: {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
  };
  health: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    avgExecutionTime: number;
    conversionRate: number;
    lastRunAt?: Date;
  };
}

interface DashboardSummary {
  total: number;
  active: number;
  draft: number;
  healthy: number;
}

export default function WorkflowDashboard() {
  const [workflows, setWorkflows] = useState<WorkflowWithHealth[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    total: 0,
    active: 0,
    draft: 0,
    healthy: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowWithHealth | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, [searchTerm, categoryFilter, statusFilter]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await workflowAPI.getWorkflows(params);

      setWorkflows(data.workflows || []);
      setSummary(data.summary || { total: 0, active: 0, draft: 0, healthy: 0 });
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      await workflowAPI.toggleWorkflow(workflowId, isActive);
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  const handleDuplicateWorkflow = async (workflowId: string) => {
    try {
      await workflowAPI.duplicateWorkflow(workflowId);
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to duplicate workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await workflowAPI.deleteWorkflow(workflowId);
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const createFromTemplate = async (templateId: string) => {
    try {
      const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId);
      const response = await fetch('/api/workflows/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          name: `${template?.name} - ${new Date().toLocaleDateString()}`,
          description: template?.description
        })
      });

      if (response.ok) {
        const newWorkflow = await response.json();
        setShowTemplateDialog(false);
        // Redirect to editor
        window.location.href = `/dashboard/landivo/workflows/${newWorkflow.id}/edit`;
      }
    } catch (error) {
      console.error('Failed to create from template:', error);
    }
  };

  const getHealthBadgeVariant = (grade: string) => {
    switch (grade) {
      case 'A': return 'default';
      case 'B': return 'secondary';
      case 'C': return 'outline';
      case 'D': case 'F': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (workflow: WorkflowWithHealth) => {
    if (!workflow.validation.isValid) {
      return <AlertTriangle className="text-red-500" size={16} />;
    }
    if (workflow.isActive) {
      return <Play className="text-green-500" size={16} />;
    }
    return <Pause className="text-gray-400" size={16} />;
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = !searchTerm ||
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || workflow.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && workflow.isActive) ||
      (statusFilter === 'draft' && !workflow.isActive) ||
      (statusFilter === 'healthy' && workflow.health.grade === 'A') ||
      (statusFilter === 'issues' && !workflow.validation.isValid);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Workflows</p>
              <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
            </div>
            <Zap className="text-blue-500" size={24} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-3xl font-bold text-green-600">{summary.active}</p>
            </div>
            <Play className="text-green-500" size={24} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-3xl font-bold text-yellow-600">{summary.draft}</p>
            </div>
            <Edit3 className="text-yellow-500" size={24} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Healthy (A Grade)</p>
              <p className="text-3xl font-bold text-blue-600">{summary.healthy}</p>
            </div>
            <CheckCircle className="text-blue-500" size={24} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWorkflowCard = (workflow: WorkflowWithHealth) => (
    <Card key={workflow.id} className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(workflow)}
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {workflow.name}
              </h3>
              <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                {workflow.isActive ? 'Active' : 'Draft'}
              </Badge>
              <Badge variant={getHealthBadgeVariant(workflow.health.grade)}>
                {workflow.health.grade}
              </Badge>
            </div>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {workflow.description || 'No description'}
            </p>

            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>Updated {new Date(workflow.updatedAt || '').toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users size={12} />
                <span>{workflow.stats.totalRuns || 0} runs</span>
              </div>
              {workflow.stats.conversionRate > 0 && (
                <div className="flex items-center space-x-1">
                  <TrendingUp size={12} />
                  <span>{workflow.stats.conversionRate.toFixed(1)}% conversion</span>
                </div>
              )}
            </div>

            {/* Health Score */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Health Score</span>
                <span className="font-medium">{workflow.health.score}%</span>
              </div>
              <Progress value={workflow.health.score} className="h-1" />
            </div>

            {/* Issues Alert */}
            {!workflow.validation.isValid && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {workflow.validation.errorCount} error(s), {workflow.validation.warningCount} warning(s)
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/landivo/workflows/${workflow.id}`}>
                  <Eye size={16} className="mr-2" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/landivo/workflows/${workflow.id}/edit`}>
                  <Edit3 size={16} className="mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleToggleWorkflow(workflow.id, !workflow.isActive)}
                disabled={!workflow.isActive && !workflow.validation.isValid}
              >
                {workflow.isActive ? (
                  <>
                    <Pause size={16} className="mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Play size={16} className="mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicateWorkflow(workflow.id)}>
                <Copy size={16} className="mr-2" />
                Duplicate
              </DropdownMenuItem>
              <Separator />
              <DropdownMenuItem
                onClick={() => handleDeleteWorkflow(workflow.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {workflow.nodes?.length || 0}
            </div>
            <div className="text-xs text-gray-500">Nodes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {workflow.stats.successfulRuns || 0}
            </div>
            <div className="text-xs text-gray-500">Success</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {workflow.stats.avgExecutionTime || 0}s
            </div>
            <div className="text-xs text-gray-500">Avg Time</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTemplateDialog = () => (
    <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Workflow Template</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WORKFLOW_TEMPLATES.map(template => (
            <Card key={template.id} className="cursor-pointer hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>

                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="outline">{template.category.replace('_', ' ')}</Badge>
                      {template.industry && (
                        <Badge variant="secondary">{template.industry}</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <div className="font-medium">{template.estimatedDuration}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Open Rate:</span>
                        <div className="font-medium text-green-600">{template.expectedResults.openRate}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Conversion:</span>
                        <div className="font-medium text-blue-600">{template.expectedResults.conversionRate}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => createFromTemplate(template.id)}
                  className="w-full"
                  size="sm"
                >
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-1">Automate your email marketing campaigns</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <Copy size={16} className="mr-2" />
            From Template
          </Button>
          <Link href="/dashboard/landivo/workflows/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" />
              Create Workflow
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="welcome_series">Welcome Series</SelectItem>
                <SelectItem value="drip_campaign">Drip Campaign</SelectItem>
                <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                <SelectItem value="lead_nurturing">Lead Nurturing</SelectItem>
                <SelectItem value="reengagement">Re-engagement</SelectItem>
                <SelectItem value="property_alerts">Property Alerts</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="healthy">Healthy (A Grade)</SelectItem>
                <SelectItem value="issues">Has Issues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Workflows Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first workflow.'
              }
            </p>
            {(!searchTerm && categoryFilter === 'all' && statusFilter === 'all') && (
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                  Browse Templates
                </Button>
                <Link href="/dashboard/landivo/workflows/create">
                  <Button>Create Workflow</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map(renderWorkflowCard)}
        </div>
      )}

      {/* Template Dialog */}
      {renderTemplateDialog()}
    </div>
  );
}