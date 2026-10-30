import api from './api';
import type { TreeGraph, TreeInfo, SearchResultItem } from '@/types/tree';

export const treeService = {
  getFullTree: (treeId = 'my-tree') =>
    api.get<TreeGraph>('/tree', { params: { treeId } }).then((r) => r.data),

  getSubTree: (rootId: string) =>
    api.get<TreeGraph>(`/tree/${rootId}`).then((r) => r.data),

  getAllTrees: () =>
    api.get<TreeInfo[]>('/trees').then((r) => r.data),

  createTree: (name: string, description?: string) =>
    api.post<TreeInfo>('/trees', { name, description }).then((r) => r.data),

  searchAll: (query: string) =>
    api.get<SearchResultItem[]>('/search', { params: { q: query } }).then((r) => r.data),
};
