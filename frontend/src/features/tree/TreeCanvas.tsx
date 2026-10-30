import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import PersonNode from './PersonNode';
import { BloodEdge, SpouseEdge } from './FamilyEdge';
import { useTree } from '@/hooks/useTree';
import { TreeEventsProvider } from './TreeEventsContext';
import type { TreeNodeData } from '@/types/tree';
import '@/styles/tree.css';

// Register custom node and edge types
const nodeTypes = { personNode: PersonNode };
const edgeTypes = { bloodEdge: BloodEdge, spouseEdge: SpouseEdge };

interface TreeCanvasProps {
  treeId?: string;
  onAddParent?: (id: string) => void;
  onAddSpouse?: (id: string) => void;
  onAddChild?: (id: string) => void;
  onViewProfile?: (id: string) => void;
  reloadTrigger?: number;
  isReadOnly?: boolean;
}

const TreeCanvas: React.FC<TreeCanvasProps> = ({
  treeId = 'my-tree',
  onAddParent,
  onAddSpouse,
  onAddChild,
  onViewProfile,
  reloadTrigger = 0,
  isReadOnly = false,
}) => {
  const { nodes: initialNodes, edges: initialEdges, isLoading, error, reload } = useTree(treeId, reloadTrigger);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TreeNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Sync state only when initial data loads
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const eventsValue = useMemo(() => ({
    onAddParent,
    onAddSpouse,
    onAddChild,
    onViewProfile,
    isReadOnly,
  }), [onAddParent, onAddSpouse, onAddChild, onViewProfile, isReadOnly]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading && nodes.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'var(--text-secondary)', fontSize: 15,
      }}>
        <span>🌳 Aile ağacı hazırlanıyor ve hizalanıyor…</span>
      </div>
    );
  }

  if (error && nodes.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 12,
      }}>
        <span style={{ color: 'var(--accent-rose)', fontSize: 16 }}>⚠️ {error}</span>
        <button
          type="button"
          onClick={reload}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            background: 'var(--accent-blue)',
            color: 'white',
            border: 'none',
          }}
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!isLoading && nodes.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 16,
        color: 'var(--text-secondary)',
      }}>
        <div style={{ fontSize: 48 }}>🌱</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Ağaç Henüz Boş</div>
        <div style={{ fontSize: 14 }}>Yukarıdaki "+ Yeni Kişi Ekle" veya "Örnek Aile Yükle" butonuna tıklayın.</div>
      </div>
    );
  }

  return (
    <TreeEventsProvider value={eventsValue}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--border-color)" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const gender = (n.data as TreeNodeData)?.person?.gender;
            const colors: Record<string, string> = {
              male: '#2563eb', female: '#db2777', other: '#7c3aed',
            };
            return colors[gender ?? ''] ?? '#6b7280';
          }}
          maskColor="rgba(0,0,0,0.5)"
        />
      </ReactFlow>
    </TreeEventsProvider>
  );
};

export default TreeCanvas;
