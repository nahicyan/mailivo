'use client';

import React, { useState, useCallback } from 'react';
import { 
  Save, 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  Eye,
  RotateCcw,
  Download,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowTemplate,
  WorkflowCategory 
} from '@/types/workflow';
import { WorkflowValidator, getWorkflowHealthScore } from '@/lib/workflow-validation';
import NodePalette from '@/components/automation/NodePalette';
import WorkflowNode from '@/components/automation/WorkflowNode';

interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave: (workflow: Workflow) => void;
  onPublish: (workflow: Workflow) => void;
  onTest: (workflow: Workflow) => void;
}

export default function WorkflowBuilder({
  workflow: initialWorkflow,
  onSave,
  onPublish,
  onTest
}: WorkflowBuilderProps) {
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow || {
    id: '',
    name: 'New Workflow',
    description: '',
    category: 'custom',
    isActive: false,
    nodes: [],
    connections: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{
    from: string;
    outputType?: 'yes' | 'no' | 'default';
  } | null>(null);
  const [activeTab, setActiveTab] = useState('builder');

  // Validation
  const validation = WorkflowValidator.validateWorkflow(workflow);
  const healthScore = getWorkflowHealthScore(workflow);
  const recommendations = WorkflowValidator.getRecommendations(workflow);

  const handleAddNode = useCallback((type: string, subtype: string, title: string, config?: any) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as 'trigger' | 'action' | 'condition' | 'wait',
      subtype,
      title,
      config: config || {},
      position: { 
        x: 100 + workflow.nodes.length * 50, 
        y: 100 + workflow.nodes.length * 30 
      },
      connections: [],
      createdAt: new Date()
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      updatedAt: new Date()
    }));
  }, [workflow.nodes.length]);

  const handleUpdateNode = useCallback((updatedNode: WorkflowNode) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === updatedNode.id ? { ...updatedNode, updatedAt: new Date() } : node
      ),
      updatedAt: new Date()
    }));
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(conn => 
        conn.from !== nodeId && conn.to !== nodeId
      ),
      updatedAt: new Date()
    }));
  }, []);

  const handleStartConnection = useCallback((fromNodeId: string, outputType?: 'yes' | 'no' | 'default') => {
    setConnecting({ from: fromNodeId, outputType });
  }, []);

  const handleCompleteConnection = useCallback((toNodeId: string) => {
    if (!connecting) return;

    const newConnection: WorkflowConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: connecting.from,
      to: toNodeId,
      condition: connecting.outputType,
      label: connecting.outputType ? connecting.outputType.toUpperCase() : undefined
    };

    setWorkflow(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection],
      updatedAt: new Date()
    }));

    setConnecting(null);
  }, [connecting]);

  const handleLoadTemplate = useCallback((template: WorkflowTemplate) => {
    const templateNodes: WorkflowNode[] = template.nodes.map((nodeTemplate, index) => ({
      id: `node_${Date.now()}_${index}`,
      ...nodeTemplate,
      position: { 
        x: 100 + index * 300, 
        y: 100 + (index % 3) * 150 
      },
      connections: [],
      createdAt: new Date()
    }));

    // Create basic connections based on template order
    const templateConnections: WorkflowConnection[] = [];
    for (let i = 0; i < templateNodes.length - 1; i++) {
      templateConnections.push({
        id: `conn_${Date.now()}_${i}`,
        from: templateNodes[i].id,
        to: templateNodes[i + 1].id,
        condition: 'default'
      });
    }

    setWorkflow(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      category: template.category,
      nodes: templateNodes,
      connections: templateConnections,
      updatedAt: new Date()
    }));
  }, []);

  const handleSave = () => {
    onSave(workflow);
  };

  const handlePublish = () => {
    if (validation.isValid) {
      onPublish({ ...workflow, isActive: true });
    }
  };

  const handleTest = () => {
    onTest(workflow);
  };

  const renderWorkflowCanvas = () => (
    <div className="relative w-full h-[600px] bg-gray-50 rounded-lg border overflow-auto">
      <div className="absolute inset-0 p-4">
        {workflow.nodes.map(node => (
          <div
            key={node.id}
            className="absolute"
            style={{
              left: node.position.x,
              top: node.position.y,
              zIndex: selectedNode === node.id ? 10 : 1
            }}
            onClick={() => setSelectedNode(node.id)}
          >
            <WorkflowNode
              node={node}
              onUpdate={handleUpdateNode}
              onDelete={() => handleDeleteNode(node.id)}
              onConnect={(outputType) => {
                if (connecting && connecting.from !== node.id) {
                  handleCompleteConnection(node.id);
                } else {
                  handleStartConnection(node.id, outputType);
                }
              }}
              isConnecting={!!connecting}
              validationErrors={validation.errors
                .filter(e => e.nodeId === node.id)
                .map(e => e.message)
              }
            />
          </div>
        ))}

        {/* Connection lines */}
        <svg className="absolute inset-0 pointer-events-none">
          {workflow.connections.map(connection => {
            const fromNode = workflow.nodes.find(n => n.id === connection.from);
            const toNode = workflow.nodes.find(n => n.id === connection.to);
            if (!fromNode || !toNode) return null;

            const fromX = fromNode.position.x + 256; // Node width
            const fromY = fromNode.position.y + 60;  // Node height / 2
            const toX = toNode.position.x;
            const toY = toNode.position.y + 60;

            return (
              <g key={connection.id}>
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke="#6b7280"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                {connection.label && (
                  <text
                    x={(fromX + toX) / 2}
                    y={(fromY + toY) / 2 - 10}
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                  >
                    {connection.label}
                  </text>
                )}
              </g>
            );
          })}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6b7280"
              />
            </marker>
          </defs>
        </svg>

        {/* Empty state */}
        {workflow.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Zap className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Building Your Workflow
              </h3>
              <p className="text-gray-500 mb-4">
                Add a trigger to begin your automation sequence
              </p>
              <Button onClick={() => setActiveTab('palette')}>
                Add Trigger
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderValidationPanel = () => (
    <div className="space-y-4">
      {/* Health Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Workflow Health</CardTitle>
            <Badge 
              variant={healthScore.grade === 'A' ? 'default' : 
                      healthScore.grade === 'B' ? 'secondary' : 'destructive'}
              className="text-lg px-3 py-1"
            >
              {healthScore.grade}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={healthScore.score} className="h-2" />
            <p className="text-sm text-gray-600">{healthScore.feedback}</p>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <AlertTriangle className="text-red-500" size={20} />
              <span>Issues ({validation.errors.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validation.errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>
                    <strong>{error.type === 'critical' ? 'Critical: ' : ''}</strong>
                    {error.message}
                    {error.suggestion && (
                      <div className="mt-1 text-xs">💡 {error.suggestion}</div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Eye className="text-yellow-500" size={20} />
              <span>Warnings ({validation.warnings.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validation.warnings.map((warning, index) => (
                <Alert key={index}>
                  <AlertDescription>
                    {warning.message}
                    <div className="mt-1 text-xs text-gray-600">💡 {warning.suggestion}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <CheckCircle className="text-blue-500" size={20} />
              <span>Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">💡 {rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workflow.name}</h1>
            <p className="text-gray-600 text-sm mt-1">
              {workflow.description || 'No description'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
              {workflow.isActive ? 'Active' : 'Draft'}
            </Badge>
            
            <Button variant="outline" size="sm" onClick={() => setWorkflow(prev => ({ ...prev, nodes: [], connections: [] }))}>
              <RotateCcw size={16} className="mr-2" />
              Clear
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleTest} disabled={!validation.isValid}>
              <Play size={16} className="mr-2" />
              Test
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Save
            </Button>
            
            <Button 
              onClick={handlePublish} 
              disabled={!validation.isValid}
              className={validation.isValid ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <Share2 size={16} className="mr-2" />
              {workflow.isActive ? 'Update' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 bg-white border-r overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 m-4">
              <TabsTrigger value="palette">Elements</TabsTrigger>
              <TabsTrigger value="validation">
                Validation
                {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                  <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs">
                    !
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <div className="px-4 pb-4">
              <TabsContent value="palette">
                <NodePalette
                  onAddNode={handleAddNode}
                  onLoadTemplate={handleLoadTemplate}
                  currentNodes={workflow.nodes}
                  workflowCategory={workflow.category}
                />
              </TabsContent>
              
              <TabsContent value="validation">
                {renderValidationPanel()}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-6 overflow-hidden">
          {renderWorkflowCanvas()}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 bg-gray-50 border-t px-6 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{workflow.nodes.length} nodes</span>
            <span>{workflow.connections.length} connections</span>
            <span>Health: {healthScore.score}%</span>
          </div>
          <div className="flex items-center space-x-2">
            {connecting && (
              <Badge variant="outline" className="animate-pulse">
                Connecting from {workflow.nodes.find(n => n.id === connecting.from)?.title}
              </Badge>
            )}
            <span>Last saved: {workflow.updatedAt?.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}