'use client';

import React, { useState, useCallback } from 'react';
import { Save, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import WorkflowCanvas from './WorkflowCanvas';
import NodePalette from './NodePalette';
import WorkflowStats from './WorkflowStats';

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

export default function WorkflowBuilder() {
  const [workflow, setWorkflow] = useState<Workflow>({
    id: '1',
    name: 'New Workflow',
    description: '',
    isActive: false,
    nodes: [],
    connections: []
  });

  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Workflow saved:', workflow);
    } catch (error) {
      console.error('Error saving workflow:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWorkflow = () => {
    setWorkflow(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <Input
                value={workflow.name}
                onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                className="text-2xl font-bold border-none p-0 h-auto bg-transparent"
                placeholder="Workflow Name"
              />
              <Input
                value={workflow.description}
                onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
                className="text-sm text-gray-600 border-none p-0 h-auto bg-transparent mt-1"
                placeholder="Add a description..."
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="workflow-active" className="text-sm">Active</Label>
              <Switch
                id="workflow-active"
                checked={workflow.isActive}
                onCheckedChange={toggleWorkflow}
              />
            </div>
            <Button
              onClick={saveWorkflow}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Workflow'}
            </Button>
            <Button
              variant="outline"
              onClick={toggleWorkflow}
              className={`flex items-center gap-2 ${workflow.isActive ? 'text-green-600' : 'text-gray-600'}`}
            >
              {workflow.isActive ? <Pause size={16} /> : <Play size={16} />}
              {workflow.isActive ? 'Pause' : 'Start'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Node Palette */}
        <div className="w-80 border-r bg-gray-50 p-4">
          <NodePalette onAddNode={addNode} />
        </div>

        {/* Canvas */}
        <WorkflowCanvas
          nodes={workflow.nodes}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
          connections={workflow.connections}
          onConnect={connectNodes}
        />

        {/* Right Sidebar - Workflow Stats */}
        <div className="w-80 border-l bg-gray-50 p-4">
          <WorkflowStats workflow={workflow} />
        </div>
      </div>
    </div>
  );
}