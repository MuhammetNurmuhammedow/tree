import { type Node, type Edge } from '@xyflow/react';
import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import type { TreeGraph, TreeNodeData } from '@/types/tree';

const elk = new ELK();

/**
 * Runs ELK hierarchical layout on the React Flow graph.
 * If customPositions are supplied (e.g. from localStorage), user-dragged positions take precedence.
 */
export async function applyELKLayout(
  graph: TreeGraph,
  customPositions?: Record<string, { x: number; y: number }>
): Promise<{ nodes: Node<TreeNodeData>[]; edges: Edge[] }> {
  // Guard: ensure nodes/edges are always arrays (backend may return null for empty tree)
  const safeNodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const safeAllEdges = Array.isArray(graph.edges) ? graph.edges : [];

  // Build a set of valid node IDs — edges referencing missing nodes cause ELK to crash
  const validNodeIds = new Set(safeNodes.map((n) => n.id));

  const elkNodes: ElkNode['children'] = safeNodes.map((n) => ({
    id: n.id,
    width: 228,
    height: 155,
  }));

  // Filter out any edge whose source or target doesn't exist in the node set
  const safeEdges = safeAllEdges.filter(
    (e) => validNodeIds.has(e.source) && validNodeIds.has(e.target)
  );

  const elkEdges = safeEdges.map((e) => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target],
  }));

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.spacing.nodeNodeBetweenLayers': '140', // Generous margin between generation layers
      'elk.spacing.nodeNode': '75', // Comfortable margin between sibling nodes
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.layered.spacing.edgeNodeBetweenLayers': '35',
      'elk.layered.spacing.edgeEdgeBetweenLayers': '25',
    },
    children: elkNodes,
    edges: elkEdges,
  };

  const layouted = await elk.layout(elkGraph);

  const nodes: Node<TreeNodeData>[] = safeNodes.map((n) => {
    // If user previously dragged this node and saved its position, preserve it
    const saved = customPositions?.[n.id];
    if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
      return {
        id: n.id,
        type: 'personNode',
        position: { x: saved.x, y: saved.y },
        data: n.data,
      };
    }

    const layoutNode = layouted.children?.find((c) => c.id === n.id);
    return {
      id: n.id,
      type: 'personNode',
      position: {
        x: layoutNode?.x ?? 0,
        y: layoutNode?.y ?? 0,
      },
      data: n.data,
    };
  });

  const edges: Edge[] = safeEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type === 'spouseEdge' ? 'spouseEdge' : 'bloodEdge',
    label: e.label,
    animated: e.type === 'spouseEdge',
  }));

  return { nodes, edges };
}
