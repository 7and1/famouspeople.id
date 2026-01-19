const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8006/api/v1';

export const apiFetch = async <T>(path: string, init?: RequestInit, next?: { revalidate?: number }) => {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    next,
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }

  return (await res.json()) as T;
};
