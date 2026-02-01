import { apiFetch } from './client';
import type { ApiPaginationMeta, PersonSummary } from './types';

export const getCategoryPeople = async (type: string, value: string, limit = 20, offset = 0, sort = 'net_worth:desc') => {
  const params = new URLSearchParams({ value, limit: String(limit), offset: String(offset), sort });
  const res = await apiFetch<{ data: PersonSummary[]; meta: ApiPaginationMeta }>(`/categories/${type}?${params.toString()}`, {}, { revalidate: 600 });
  return res;
};
