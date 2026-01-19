import { apiFetch } from './client';

export const getRelationships = async (slug: string) => {
  const res = await apiFetch<{ data: { nodes: any[]; edges: any[] } }>(`/people/${slug}/relationships`, {}, { revalidate: 3600 });
  return res.data;
};
