import { apiFetch } from './client';
import type { CompareResponse } from './types';

export const comparePeople = async (ids: string[]) => {
  const res = await apiFetch<{ data: CompareResponse }>(`/compare?ids=${ids.join(',')}`, {}, { revalidate: 3600 });
  return res.data;
};
