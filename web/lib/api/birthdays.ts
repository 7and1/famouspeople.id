import { apiFetch } from './client';

export const getBirthdaysToday = async (limit = 100) => {
  const res = await apiFetch<{ data: any[] }>(`/birthdays/today?limit=${limit}`, {}, { revalidate: 3600 });
  return res.data;
};

export const getBirthdaysMonth = async (month: string, limit = 200) => {
  const res = await apiFetch<{ data: any[] }>(`/birthdays/${month}?limit=${limit}`, {}, { revalidate: 3600 });
  return res.data;
};
