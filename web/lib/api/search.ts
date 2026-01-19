import { apiFetch } from './client';

export interface SearchResult {
  data: any[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    has_next: boolean;
    facets?: any;
  };
}

export const searchPeople = async (params: Record<string, string | number | boolean | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });
  const res = await apiFetch<SearchResult>(`/search?${query.toString()}`, {}, { revalidate: 600 });
  return res;
};
