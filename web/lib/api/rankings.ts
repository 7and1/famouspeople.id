import { apiFetch } from './client';
import type { RankingItem, RankingMeta } from './types';

export const getRankings = async (category: string, sub?: string, limit = 50) => {
  const path = sub ? `/rankings/${category}/${sub}?limit=${limit}` : `/rankings/${category}?limit=${limit}`;
  const res = await apiFetch<{ data: RankingItem[]; meta: RankingMeta }>(path, {}, { revalidate: 3600 });
  return res;
};
