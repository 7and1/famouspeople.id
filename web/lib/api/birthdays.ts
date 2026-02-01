import { apiFetch } from './client';
import type { PersonSummary } from './types';

export const getBirthdaysToday = async (limit = 100) => {
  const res = await apiFetch<{ data: PersonSummary[] }>(`/birthdays/today?limit=${limit}`, {}, { revalidate: 3600 });
  return res.data;
};

export const getBirthdaysMonth = async (month: string, limit = 200) => {
  const res = await apiFetch<{ data: PersonSummary[] }>(`/birthdays/${month}?limit=${limit}`, {}, { revalidate: 3600 });
  return res.data;
};
