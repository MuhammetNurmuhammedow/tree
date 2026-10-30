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
  const elkNodes: ElkNode['children'] = graph.nodes.map((n) => ({
    id: n.id,
    width: 236,
    height: 110,
  }));

  const elkEdges = graph.edges.map((e) => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target],
  }));

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.spacing.nodeNodeBetweenLayers': '95',
      'elk.spacing.nodeNode': '60',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
    },
    children: elkNodes,
    edges: elkEdges,
  };

  const layouted = await elk.layout(elkGraph);

  const nodes: Node<TreeNodeData>[] = graph.nodes.map((n) => {
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

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type === 'spouseEdge' ? 'spouseEdge' : 'bloodEdge',
    label: e.label,
    animated: e.type === 'spouseEdge',
  }));

  return { nodes, edges };
}
