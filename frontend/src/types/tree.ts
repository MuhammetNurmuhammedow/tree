// TypeScript type definitions for the React Flow tree graph

import type { Person } from './person';

export interface TreeNodeData extends Record<string, unknown> {
  person: Person;
  onAddParent?: (id: string) => void;
  onAddSpouse?: (id: string) => void;
  onAddChild?: (id: string) => void;
  onViewProfile?: (id: string) => void;
}

export interface TreeNodePosition {
  x: number;
  y: number;
}

export interface TreeNode {
  id: string;
  type: 'personNode';
  position: TreeNodePosition;
  data: TreeNodeData;
}

export type EdgeType = 'bloodEdge' | 'spouseEdge';

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
}

export interface TreeGraph {
  nodes: TreeNode[];
  edges: TreeEdge[];
}

export interface TreeInfo {
  id: string;
  name: string;
  description?: string;
  owner_name: string;
  is_owner: boolean;
  member_count: number;
  created_at: string;
}

export interface SearchResultItem {
  person_id: string;
  full_name: string;
  tree_id: string;
  tree_name: string;
  is_my_tree: boolean;
  gender: string;
  years: string;
  birth_place?: string;
}
