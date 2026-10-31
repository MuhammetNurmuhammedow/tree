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
  resetLayout: () => void;
}

export function useTree(treeId = 'my-tree', reloadTrigger = 0): UseTreeReturn {
  const [nodes, setNodes]       = useState<Node<TreeNodeData>[]>([]);
  const [edges, setEdges]       = useState<Edge[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const getSavedPositions = useCallback((): Record<string, { x: number; y: number }> => {
    try {
      const raw = localStorage.getItem(`familytree_positions_${treeId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignore parse error
    }
    return {};
  }, [treeId]);

  const load = useCallback(async (ignoreSavedPositions = false) => {
    try {
      setLoading(true);
      setError(null);
      const graph = await treeService.getFullTree(treeId);

      if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }
      const savedPositions = ignoreSavedPositions ? {} : getSavedPositions();
      const { nodes: layoutedNodes, edges: layoutedEdges } = await applyELKLayout(graph, savedPositions);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ağaç yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [treeId, getSavedPositions]);

  const resetLayout = useCallback(() => {
    try {
      localStorage.removeItem(`familytree_positions_${treeId}`);
    } catch {
      // ignore
    }
    load(true);
  }, [treeId, load]);

  useEffect(() => {
    load();
  }, [load, reloadTrigger]);

  return { nodes, edges, isLoading, error, reload: () => load(false), resetLayout };
}
