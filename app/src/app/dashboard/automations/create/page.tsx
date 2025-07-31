'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import WorkflowCanvas from '@/components/automation/WorkflowCanvas';
import NodePalette from '@/components/automation/NodePalette';
import WorkflowStats from '@/components/automation/WorkflowStats';
import { workflowAPI, WorkflowNode, WorkflowConnection } from '@/services/workflowAPI';

interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

export default function CreateWorkflowPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [workflow, setWorkflow] = useState<Workflow>({
    id: '',
    name: '',
    description: '',
    isActive: false,
    nodes: [],
    connections: []
  });

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
      const newWorkflow = await workflowAPI.createWorkflow(workflow);
      toast.success('Workflow created successfully');
      router.push(`/dashboard/automations/${newWorkflow.id}`);
    } catch (error) {
      toast.error('Failed to create workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const canActivate = workflow.nodes.some(n => n.type === 'trigger') && 
                     workflow.nodes.some(n => n.type === 'action');

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
                  onCheckedChange={(checked) => setWorkflow(prev => ({ ...prev, isActive: checked }))}
                  disabled={!canActivate}
                />
              </div>
              
              <Button
                onClick={saveWorkflow}
                disabled={isSaving || !workflow.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save size={16} className="mr-2" />
                {isSaving ? 'Creating...' : 'Create Workflow'}
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

      {/* Floating Save Button */}
      {workflow.nodes.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="font-medium">{workflow.nodes.length} nodes</span>
          </div>
          <Button
            size="sm"
            onClick={saveWorkflow}
            disabled={isSaving || !workflow.name.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save size={14} className="mr-1" />
            {isSaving ? 'Creating...' : 'Create'}
          </Button>
        </div>
      )}
    </div>
  );
}