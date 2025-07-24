'use client';

import React, { useState, useRef } from 'react';
import { Zap, ChevronDown } from 'lucide-react';
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
  const [isConnecting, setIsConnecting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggedNode(nodeId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const nodeToUpdate = nodes.find(n => n.id === draggedNode);
      if (nodeToUpdate) {
        onUpdateNode(draggedNode, {
          ...nodeToUpdate,
          position: { x, y }
        });
      }
    }
    setDraggedNode(null);
  };

  return (
    <div 
      ref={canvasRef}
      className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-4 relative overflow-auto min-h-[600px]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Zap size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Start building your workflow</p>
            <p className="text-sm">Drag elements from the palette to begin</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex flex-col items-center">
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, node.id)}
                style={{
                  transform: `translate(${node.position?.x || 0}px, ${node.position?.y || 0}px)`
                }}
              >
                <WorkflowNode
                  node={node}
                  onUpdate={(updatedNode) => onUpdateNode(node.id, updatedNode)}
                  onDelete={onDeleteNode}
                  isConnecting={isConnecting}
                  onConnect={() => onConnect(node.id, node.id)}
                />
              </div>
              
              {index < nodes.length - 1 && (
                <div className="flex flex-col items-center my-4">
                  <div className="w-px h-8 bg-gray-300"></div>
                  <ChevronDown className="text-gray-400" size={20} />
                  <div className="w-px h-8 bg-gray-300"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}