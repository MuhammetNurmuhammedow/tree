import { useState, useEffect, useCallback } from 'react';
import { type Node, type Edge } from '@xyflow/react';
import { treeService } from '@/services/treeService';
import { applyELKLayout } from '@/features/tree/layoutEngine';
import type { TreeNodeData } from '@/types/tree';

interface UseTreeReturn {
  nodes: Node<TreeNodeData>[];
  edges: Edge[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export function useTree(treeId = 'my-tree', reloadTrigger = 0): UseTreeReturn {
  const [nodes, setNodes]       = useState<Node<TreeNodeData>[]>([]);
  const [edges, setEdges]       = useState<Edge[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const graph = await treeService.getFullTree(treeId);

      if (!graph.nodes || graph.nodes.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }

      const { nodes: layoutedNodes, edges: layoutedEdges } = await applyELKLayout(graph);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ağaç yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    load();
  }, [load, reloadTrigger]);

  return { nodes, edges, isLoading, error, reload: load };
}
