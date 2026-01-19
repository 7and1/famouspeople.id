import { apiFetch } from './client';

export const comparePeople = async (ids: string[]) => {
  const res = await apiFetch<{ data: { people: any[]; comparison: any } }>(`/compare?ids=${ids.join(',')}`, {}, { revalidate: 3600 });
  return res.data;
};
