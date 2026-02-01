import { apiFetch } from './client';
import type { RelationshipEdge, RelationshipNode } from './types';

export const getRelationships = async (slug: string) => {
  const res = await apiFetch<{ data: { nodes: RelationshipNode[]; edges: RelationshipEdge[] } }>(`/people/${slug}/relationships`, {}, { revalidate: 3600 });
  return res.data;
};
