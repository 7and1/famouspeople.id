import { apiFetch } from './client';

export const getRankings = async (category: string, sub?: string, limit = 50) => {
  const path = sub ? `/rankings/${category}/${sub}?limit=${limit}` : `/rankings/${category}?limit=${limit}`;
  const res = await apiFetch<{ data: any[]; meta: any }>(path, {}, { revalidate: 3600 });
  return res;
};
