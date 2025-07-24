'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Copy,
  MoreVertical,
  Zap,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { workflowAPI } from '@/services/workflowAPI';

interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  nodes: any[];
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await workflowAPI.getWorkflows();
      setWorkflows(data.workflows || []);
    } catch (error) {
      toast.error('Failed to load workflows');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWorkflow = async (id: string, isActive: boolean) => {
    try {
      await workflowAPI.toggleWorkflow(id, isActive);
      setWorkflows(workflows.map(w => 
        w.id === id ? { ...w, isActive } : w
      ));
      toast.success(`Workflow ${isActive ? 'activated' : 'paused'}`);
    } catch (error) {
      toast.error('Failed to toggle workflow');
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      await workflowAPI.deleteWorkflow(id);
      setWorkflows(workflows.filter(w => w.id !== id));
      toast.success('Workflow deleted');
    } catch (error) {
      toast.error('Failed to delete workflow');
    }
  };

  const handleDuplicateWorkflow = async (id: string) => {
    try {
      const duplicated = await workflowAPI.duplicateWorkflow(id);
      setWorkflows([duplicated, ...workflows]);
      toast.success('Workflow duplicated');
    } catch (error) {
      toast.error('Failed to duplicate workflow');
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && workflow.isActive) ||
      (activeTab === 'draft' && !workflow.isActive);
    
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.isActive).length,
    draft: workflows.filter(w => !w.isActive).length,
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-1">Automate your email marketing campaigns</p>
        </div>
        <Link href="/dashboard/landivo/workflows/create">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={16} className="mr-2" />
            Create Workflow
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Play className="text-green-500" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-3xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <Pause className="text-gray-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-purple-600">0</p>
              </div>
              <TrendingUp className="text-purple-500" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({stats.draft})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Workflows Grid */}
      {filteredWorkflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map(workflow => (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg font-semibold truncate">
                        {workflow.name}
                      </CardTitle>
                      <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                        {workflow.isActive ? 'Active' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {workflow.description || 'No description'}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/landivo/workflows/${workflow.id}`}>
                          <Edit size={14} className="mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateWorkflow(workflow.id)}>
                        <Copy size={14} className="mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleToggleWorkflow(workflow.id, !workflow.isActive)}
                        className={workflow.isActive ? 'text-orange-600' : 'text-green-600'}
                      >
                        {workflow.isActive ? 
                          <><Pause size={14} className="mr-2" />Pause</> :
                          <><Play size={14} className="mr-2" />Activate</>
                        }
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="text-red-600"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Zap size={12} />
                      {workflow.nodes?.length || 0} nodes
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(workflow.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <Link href={`/dashboard/landivo/workflows/${workflow.id}`}>
                    <Button variant="outline" className="w-full">
                      <Edit size={14} className="mr-2" />
                      Edit Workflow
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Zap size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No workflows found' : 'No workflows yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 
              'Try adjusting your search term' : 
              'Get started by creating your first automated workflow'
            }
          </p>
          <Link href="/dashboard/landivo/workflows/create">
            <Button>
              <Plus size={16} className="mr-2" />
              Create Your First Workflow
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}