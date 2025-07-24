'use client';

import React, { useState, useRef } from 'react';
import { Zap, ChevronDown, Settings, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import WorkflowNode from './WorkflowNode';

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

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  onUpdateNode: (nodeId: string, updatedNode: WorkflowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  connections: WorkflowConnection[];
  onConnect: (fromNodeId: string, toNodeId: string) => void;
}

export default function WorkflowCanvas({ 
  nodes, 
  onUpdateNode, 
  onDeleteNode, 
  connections, 
  onConnect 
}: WorkflowCanvasProps) {
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDraggedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNode || !canvasRef.current) return;

    e.preventDefault();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - dragOffset.x;
    const newY = e.clientY - canvasRect.top - dragOffset.y;

    const nodeToUpdate = nodes.find(n => n.id === draggedNode);
    if (nodeToUpdate) {
      onUpdateNode(draggedNode, {
        ...nodeToUpdate,
        position: { x: Math.max(0, newX), y: Math.max(0, newY) }
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);

  return (
    <div 
      ref={canvasRef}
      className="flex-1 bg-gray-50 relative overflow-auto min-h-full"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Zap size={64} className="mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              Start building your workflow
            </h3>
            <p className="text-gray-500 mb-6">
              Drag elements from the left palette to begin creating your automated email workflow
            </p>
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-left">
              <h4 className="font-medium text-gray-700 mb-2">💡 Quick Tips:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Start with a trigger to define when your workflow begins</li>
                <li>• Add actions to perform when triggered</li>
                <li>• Use conditions to create smart branching logic</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* Render nodes in a vertical flow */}
          <div className="flex flex-col items-center space-y-6 min-h-full">
            {sortedNodes.map((node, index) => (
              <div key={node.id} className="flex flex-col items-center">
                <div
                  className="relative"
                  style={{
                    transform: `translate(${node.position.x}px, 0px)`,
                    cursor: draggedNode === node.id ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                >
                  <WorkflowNode
                    node={node}
                    onUpdate={(updatedNode) => onUpdateNode(node.id, updatedNode)}
                    onDelete={() => onDeleteNode(node.id)}
                    isConnecting={false}
                    onConnect={() => {}}
                  />
                </div>
                
                {/* Connection arrow to next node */}
                {index < sortedNodes.length - 1 && (
                  <div className="flex flex-col items-center my-4">
                    <div className="w-px h-6 bg-gray-300"></div>
                    <ChevronDown className="text-gray-400" size={24} />
                    <div className="w-px h-6 bg-gray-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Canvas Grid Background */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(#000 1px, transparent 1px),
            linear-gradient(90deg, #000 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
    </div>
  );
}