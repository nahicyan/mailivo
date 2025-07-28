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
import { WorkflowCategory, WORKFLOW_TEMPLATES } from '@mailivo/shared-types';
import { workflowAPI } from '@/services/workflowAPI';
import { toast } from 'sonner';
import Link from 'next/link';

// Local interface definition to avoid shared-types resolution issues
interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  nodes: any[];
  connections: any[];
  createdAt?: string;
  updatedAt?: string;
  lastRunAt?: string;
}

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

      // Filter out workflows without valid IDs and add safety checks
      const validWorkflows = (data.workflows || []).filter((workflow: any) => {
        if (!workflow.id || workflow.id === 'undefined') {
          console.warn('Skipping workflow without valid ID:', workflow);
          return false;
        }
        // Validate ObjectId format
        if (!workflow.id.match(/^[0-9a-fA-F]{24}$/)) {
          console.warn('Skipping workflow with invalid ID format:', workflow.id);
          return false;
        }
        return true;
      });

      setWorkflows(validWorkflows);
      setSummary(data.summary || { total: 0, active: 0, draft: 0, healthy: 0 });
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      toast.error('Failed to load workflows. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWorkflow = async (workflowId: string, isActive: boolean) => {
    if (!workflowId || workflowId === 'undefined') {
      toast.error('Invalid workflow ID');
      return;
    }

    try {
      await workflowAPI.toggleWorkflow(workflowId, isActive);
      toast.success(`Workflow ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
      toast.error('Failed to update workflow status');
    }
  };

  const handleDuplicateWorkflow = async (workflowId: string) => {
    if (!workflowId || workflowId === 'undefined') {
      toast.error('Invalid workflow ID');
      return;
    }

    try {
      await workflowAPI.duplicateWorkflow(workflowId);
      toast.success('Workflow duplicated successfully');
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to duplicate workflow:', error);
      toast.error('Failed to duplicate workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!workflowId || workflowId === 'undefined') {
      toast.error('Invalid workflow ID');
      return;
    }

    if (!confirm('Are you sure you want to delete this workflow?')) {
      return;
    }

    try {
      await workflowAPI.deleteWorkflow(workflowId);
      toast.success('Workflow deleted successfully');
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      toast.error('Failed to delete workflow');
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
        
        // Validate the new workflow has a proper ID before redirecting
        if (newWorkflow.id && newWorkflow.id !== 'undefined') {
          window.location.href = `/dashboard/landivo/workflows/${newWorkflow.id}/edit`;
        } else {
          toast.error('Created workflow has invalid ID');
          fetchWorkflows(); // Refresh the list instead
        }
      } else {
        toast.error('Failed to create workflow from template');
      }
    } catch (error) {
      console.error('Failed to create from template:', error);
      toast.error('Failed to create workflow from template');
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
    if (!workflow.validation?.isValid) {
      return <AlertTriangle className="text-red-500" size={16} />;
    }
    if (workflow.isActive) {
      return <Play className="text-green-500" size={16} />;
    }
    return <Pause className="text-gray-500" size={16} />;
  };

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

  const renderWorkflowCard = (workflow: WorkflowWithHealth) => {
    // Safety check for workflow ID
    if (!workflow.id || workflow.id === 'undefined') {
      console.warn('Workflow missing or invalid ID:', workflow);
      return null;
    }

    // Validate ObjectId format
    if (!workflow.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.warn('Workflow with invalid ID format:', workflow.id);
      return null;
    }

    return (
      <Card key={workflow.id} className="hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(workflow)}
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {workflow.name || 'Unnamed Workflow'}
                </h3>
                <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                  {workflow.isActive ? 'Active' : 'Draft'}
                </Badge>
                <Badge variant={getHealthBadgeVariant(workflow.health?.grade || 'F')}>
                  {workflow.health?.grade || 'F'}
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
                  <span>{workflow.stats?.totalRuns || 0} runs</span>
                </div>
                {workflow.stats?.conversionRate > 0 && (
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
                  <span className="font-medium">{workflow.health?.score || 0}%</span>
                </div>
                <Progress value={workflow.health?.score || 0} className="h-1" />
              </div>

              {/* Issues Alert */}
              {!workflow.validation?.isValid && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {workflow.validation?.errorCount || 0} error(s), {workflow.validation?.warningCount || 0} warning(s)
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
                {/* Only render links if workflow.id is valid */}
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
                  disabled={!workflow.isActive && !workflow.validation?.isValid}
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
                <DropdownMenuItem
                  onClick={() => handleDeleteWorkflow(workflow.id)}
                  className="text-red-600"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

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
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Automation</h1>
          <p className="text-gray-600 mt-1">Create and manage your email automation workflows</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowTemplateDialog(true)}
          >
            <Zap className="mr-2" size={16} />
            Templates
          </Button>
          <Button asChild>
            <Link href="/dashboard/landivo/workflows/create">
              <Plus className="mr-2" size={16} />
              Create Workflow
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Filters and Search */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="welcome">Welcome</SelectItem>
            <SelectItem value="nurture">Nurture</SelectItem>
            <SelectItem value="retention">Retention</SelectItem>
            <SelectItem value="landivo">Landivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No workflows</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new workflow.</p>
          <div className="mt-6 flex justify-center space-x-3">
            <Button onClick={() => setShowTemplateDialog(true)} variant="outline">
              Browse Templates
            </Button>
            <Button asChild>
              <Link href="/dashboard/landivo/workflows/create">
                Create Workflow
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map(workflow => renderWorkflowCard(workflow)).filter(Boolean)}
        </div>
      )}

      {/* Template Selection Dialog */}
      {renderTemplateDialog()}
    </div>
  );
}