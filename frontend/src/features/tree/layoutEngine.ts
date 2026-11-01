import { type Node, type Edge } from '@xyflow/react';
import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import type { TreeGraph, TreeNode, TreeEdge, TreeNodeData, FamilyEdgeData } from '@/types/tree';

const elk = new ELK();

// Card footprint used for layout; keep in sync with `.person-node` in tree.css.
export const NODE_WIDTH = 236;
export const NODE_HEIGHT = 84;
// Horizontal gap between spouses inside one family block (room for the marriage badge).
export const COUPLE_GAP = 48;
// Spouse lines attach at this height from the card top (the card's middle).
export const SPOUSE_ANCHOR_Y = NODE_HEIGHT / 2;

/**
 * Union-find over spouse edges: every set is one family block whose members
 * are laid out side by side on the same generation row.
 */
function buildFamilyBlocks(nodes: TreeNode[], spouseEdges: TreeEdge[]): string[][] {
  const parent = new Map(nodes.map((n) => [n.id, n.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(id, root);
    return root;
  };
  for (const e of spouseEdges) parent.set(find(e.source), find(e.target));

  const groups = new Map<string, string[]>();
  for (const n of nodes) {
    const root = find(n.id);
    groups.set(root, [...(groups.get(root) ?? []), n.id]);
  }

  // Order members along the chain of marriages so each spouse line only spans
  // neighbouring cards: start from an end of the chain and walk it.
  const adjacency = new Map<string, string[]>();
  for (const e of spouseEdges) {
    adjacency.set(e.source, [...(adjacency.get(e.source) ?? []), e.target]);
    adjacency.set(e.target, [...(adjacency.get(e.target) ?? []), e.source]);
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const genderRank = (id: string) => (byId.get(id)?.data.person.gender === 'male' ? 0 : 1);

  return [...groups.values()].map((members) => {
    if (members.length === 1) return members;
    const ends = members.filter((id) => (adjacency.get(id)?.length ?? 0) <= 1).sort((a, b) => genderRank(a) - genderRank(b));
    const ordered: string[] = [];
    const seen = new Set<string>();
    const walk = (id: string) => {
      if (seen.has(id)) return;
      seen.add(id);
      ordered.push(id);
      (adjacency.get(id) ?? []).forEach(walk);
    };
    walk(ends[0] ?? members[0]);
    members.forEach(walk);
    return ordered;
  });
}

const birthKey = (n?: TreeNode) => n?.data.person.birth_date ?? '9999';

/**
 * Lays the family out by generation: spouses share a row, children sit on the
 * row below their parents, and siblings are ordered oldest to youngest.
 * User-dragged positions (customPositions) take precedence over the computed layout.
 */
export async function applyELKLayout(
  graph: TreeGraph,
  customPositions?: Record<string, { x: number; y: number }>
): Promise<{ nodes: Node<TreeNodeData>[]; edges: Edge<FamilyEdgeData>[] }> {
  // Guard: ensure nodes/edges are always arrays (backend may return null for empty tree)
  const safeNodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const allEdges = Array.isArray(graph.edges) ? graph.edges : [];

  // Edges referencing missing nodes cause ELK to crash
  const validNodeIds = new Set(safeNodes.map((n) => n.id));
  const safeEdges = allEdges.filter((e) => validNodeIds.has(e.source) && validNodeIds.has(e.target));
  const spouseEdges = safeEdges.filter((e) => e.type === 'spouseEdge');
  const bloodEdges = safeEdges.filter((e) => e.type !== 'spouseEdge');

  const nodeById = new Map(safeNodes.map((n) => [n.id, n]));
  const blocks = buildFamilyBlocks(safeNodes, spouseEdges);
  const blockOf = new Map<string, number>();
  blocks.forEach((members, i) => members.forEach((id) => blockOf.set(id, i)));

  // Model order drives ELK's left-to-right placement: oldest family first.
  const blockOrder = blocks
    .map((members, i) => ({ i, key: members.map((id) => birthKey(nodeById.get(id))).sort()[0] }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const blockEdgeIds = new Set<string>();
  const elkEdges: NonNullable<ElkNode['edges']> = [];
  for (const e of [...bloodEdges].sort((a, b) => birthKey(nodeById.get(a.target)).localeCompare(birthKey(nodeById.get(b.target))))) {
    const from = blockOf.get(e.source)!;
    const to = blockOf.get(e.target)!;
    const id = `b${from}-b${to}`;
    if (from === to || blockEdgeIds.has(id)) continue;
    blockEdgeIds.add(id);
    elkEdges.push({ id, sources: [`b${from}`], targets: [`b${to}`] });
  }

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.spacing.nodeNodeBetweenLayers': '72',
      'elk.spacing.nodeNode': '44',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.spacing.edgeNodeBetweenLayers': '32',
      'elk.spacing.componentComponent': '120',
    },
    children: blockOrder.map(({ i }) => ({
      id: `b${i}`,
      width: blocks[i].length * NODE_WIDTH + (blocks[i].length - 1) * COUPLE_GAP,
      height: NODE_HEIGHT,
    })),
    edges: elkEdges,
  };

  const layouted = await elk.layout(elkGraph);
  const blockPos = new Map((layouted.children ?? []).map((c) => [c.id, { x: c.x ?? 0, y: c.y ?? 0 }]));

  const nodes: Node<TreeNodeData>[] = safeNodes.map((n) => {
    const saved = customPositions?.[n.id];
    let position: { x: number; y: number };
    if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
      position = { x: saved.x, y: saved.y };
    } else {
      const b = blockOf.get(n.id)!;
      const origin = blockPos.get(`b${b}`) ?? { x: 0, y: 0 };
      const slot = blocks[b].indexOf(n.id);
      position = { x: origin.x + slot * (NODE_WIDTH + COUPLE_GAP), y: origin.y };
    }
    return { id: n.id, type: 'personNode', position, data: n.data };
  });
  const posById = new Map(nodes.map((n) => [n.id, n.position]));

  // Spouse lines run between the facing sides of the two cards.
  const edges: Edge<FamilyEdgeData>[] = spouseEdges.map((e) => {
    const [left, right] = (posById.get(e.source)?.x ?? 0) <= (posById.get(e.target)?.x ?? 0)
      ? [e.source, e.target]
      : [e.target, e.source];
    return {
      id: e.id,
      source: left,
      target: right,
      sourceHandle: 'spouse-right',
      targetHandle: 'spouse-left',
      type: 'spouseEdge',
      label: e.label,
      data: { relationshipType: e.relationship_type },
    };
  });

  // A child of a couple gets a single line dropped from the middle of the
  // couple's marriage line instead of one line per parent.
  const spousePairs = new Set(spouseEdges.flatMap((e) => [`${e.source}|${e.target}`, `${e.target}|${e.source}`]));
  const parentsByChild = new Map<string, TreeEdge[]>();
  for (const e of bloodEdges) parentsByChild.set(e.target, [...(parentsByChild.get(e.target) ?? []), e]);

  for (const parentEdges of parentsByChild.values()) {
    const used = new Set<string>();
    for (const e of parentEdges) {
      if (used.has(e.id)) continue;
      const partnerEdge = parentEdges.find((o) => o.id !== e.id && !used.has(o.id) && spousePairs.has(`${e.source}|${o.source}`));
      used.add(e.id);
      if (partnerEdge) used.add(partnerEdge.id);
      edges.push({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'bloodEdge',
        data: { relationshipType: e.relationship_type, partnerId: partnerEdge?.source },
      });
    }
  }

  return { nodes, edges };
}
