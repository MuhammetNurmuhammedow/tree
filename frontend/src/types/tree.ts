// TypeScript type definitions for the React Flow tree graph

import type { Person } from './person';

export interface TreeNodeData extends Record<string, unknown> {
  person: Person;
  isHighlighted?: boolean;
  /** Person whose profile panel is open. */
  isSelected?: boolean;
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
  relationship_type?: string;
  /** User's custom kinship title; empty means "use the localized default". */
  label?: string;
}

/** Extra data the layout engine attaches to React Flow edges. */
export interface FamilyEdgeData extends Record<string, unknown> {
  relationshipType?: string;
  /** For a child of a couple: the other parent, so the line starts mid-marriage. */
  partnerId?: string;
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
  is_living: boolean;
  birth_year?: string;
  death_year?: string;
  birth_place?: string;
  maiden_name?: string;
  match_field?: 'maiden_name' | 'birth_place' | 'death_place' | 'biography';
  match_context?: string;
}
