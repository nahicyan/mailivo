'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import WorkflowCanvas from '@/components/automation/WorkflowCanvas';
import NodePalette from '@/components/automation/NodePalette';
import WorkflowStats from '@/components/automation/WorkflowStats';
import { workflowAPI, WorkflowNode, WorkflowConnection, Workflow } from '@/services/workflowAPI';

export default function EditWorkflowPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id as string;
  
  const [workflow, setWorkflow] = useState<Workflow>({
    id: '',
    name: '',
    description: '',
    isActive: false,
    nodes: [],
    connections: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId]);

  const loadWorkflow = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await workflowAPI.getWorkflow(id);
      setWorkflow(data);
    } catch (error) {
      toast.error('Failed to load workflow');
      router.push('/dashboard/automations');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addNode = useCallback((type: string, subtype: string, title: string) => {
    const newNode: WorkflowNode = {
      id: generateNodeId(),
      type: type as 'trigger' | 'action' | 'condition',
      subtype,
      title,
      description: '',
      config: {},
      position: { x: 0, y: workflow.nodes.length * 200 }
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
  }, [workflow.nodes.length]);

  const updateNode = useCallback((nodeId: string, updatedNode: WorkflowNode) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? updatedNode : node
      )
    }));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(conn => 
        conn.from !== nodeId && conn.to !== nodeId
      )
    }));
  }, []);

  const connectNodes = useCallback((fromNodeId: string, toNodeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      connections: [...prev.connections, { from: fromNodeId, to: toNodeId }]
    }));
  }, []);

  const saveWorkflow = async () => {
    if (!workflow.name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    setIsSaving(true);
    try {
      const updatedWorkflow = await workflowAPI.updateWorkflow(workflow.id, workflow);
      setWorkflow(updatedWorkflow);
      toast.success('Workflow updated successfully');
    } catch (error) {
      toast.error('Failed to update workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWorkflow = async () => {
    if (!canActivate && !workflow.isActive) {
      toast.error('Add a trigger and action before activating');
      return;
    }

    setIsActivating(true);
    try {
      const newStatus = !workflow.isActive;
      const updatedWorkflow = await workflowAPI.toggleWorkflow(workflow.id, newStatus);
      setWorkflow(updatedWorkflow);
      toast.success(`Workflow ${newStatus ? 'activated' : 'paused'}`);
    } catch (error) {
      toast.error('Failed to toggle workflow');
    } finally {
      setIsActivating(false);
    }
  };

  const canActivate = workflow.nodes.some(n => n.type === 'trigger') && 
                     workflow.nodes.some(n => n.type === 'action');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading workflow...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/automations')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Workflows
              </Button>
              
              <div className="border-l border-gray-300 pl-4 space-y-2">
                <div>
                  <Label htmlFor="workflow-name" className="text-sm font-medium">
                    Workflow Name
                  </Label>
                  <Input
                    id="workflow-name"
                    value={workflow.name}
                    onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter workflow name"
                    className="text-xl font-bold border-none p-0 h-auto bg-transparent"
                  />
                </div>
                <div>
                  <Label htmlFor="workflow-description" className="text-sm font-medium text-gray-600">
                    Description
                  </Label>
                  <Input
                    id="workflow-description"
                    value={workflow.description}
                    onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add a description..."
                    className="text-sm text-gray-600 border-none p-0 h-auto bg-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <Label htmlFor="workflow-active" className="text-sm font-medium">
                  Active
                </Label>
                <Switch
                  id="workflow-active"
                  checked={workflow.isActive}
                  onCheckedChange={toggleWorkflow}
                  disabled={isActivating}
                />
              </div>
              
              <Button
                onClick={saveWorkflow}
                disabled={isSaving || !workflow.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save size={16} className="mr-2" />
                {isSaving ? 'Saving...' : 'Save Workflow'}
              </Button>
              
              <Button
                variant="outline"
                onClick={toggleWorkflow}
                disabled={isActivating || (!canActivate && !workflow.isActive)}
                className={`${workflow.isActive ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
              >
                {workflow.isActive ? <Pause size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
                {isActivating ? 'Processing...' : workflow.isActive ? 'Pause' : 'Start'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex h-[calc(100vh-140px)]">
          {/* Left Sidebar - Node Palette */}
          <div className="w-80 bg-white border-r border-gray-200 shadow-sm">
            <div className="p-4 h-full overflow-y-auto">
              <NodePalette onAddNode={addNode} />
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-white">
            <WorkflowCanvas
              nodes={workflow.nodes}
              onUpdateNode={updateNode}
              onDeleteNode={deleteNode}
              connections={workflow.connections}
              onConnect={connectNodes}
            />
          </div>

          {/* Right Sidebar - Workflow Stats */}
          <div className="w-80 bg-white border-l border-gray-200 shadow-sm">
            <div className="p-4 h-full overflow-y-auto">
              <WorkflowStats workflow={workflow} />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Panel */}
      {workflow.nodes.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${workflow.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="font-medium">{workflow.nodes.length} nodes</span>
          </div>
          <Button
            size="sm"
            onClick={saveWorkflow}
            disabled={isSaving}
            variant="outline"
          >
            <Save size={14} className="mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  );
}