type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function getRestBase(url: string) {
  return `${url.replace(/\/$/, '')}/rest/v1`;
}

export function buildInFilter(values: string[]) {
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  return `in.(${cleaned.join(',')})`;
}

export function parseContentRangeTotal(contentRange: string | null): number | null {
  if (!contentRange) return null;
  const parts = contentRange.split('/');
  const total = parts[1];
  if (!total) return null;
  const n = Number(total);
  return Number.isFinite(n) ? n : null;
}

export async function supabaseSelect<T>(
  table: string,
  query: URLSearchParams,
  options?: { countExact?: boolean; revalidateSeconds?: number }
): Promise<{ data: T[]; total: number | null }> {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('Supabase config missing (SUPABASE_URL / SUPABASE_ANON_KEY)');

  const url = `${getRestBase(cfg.url)}/${table}?${query.toString()}`;
  const res = await fetch(url, {
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      Accept: 'application/json',
      ...(options?.countExact ? { Prefer: 'count=exact' } : {}),
    },
    next: options?.revalidateSeconds ? { revalidate: options.revalidateSeconds } : undefined,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Supabase select failed (${res.status}): ${msg.slice(0, 160)}`);
  }

  const total = options?.countExact ? parseContentRangeTotal(res.headers.get('content-range')) : null;
  const data = (await res.json()) as T[];
  return { data, total };
}

export async function supabaseRpc<T>(
  fnName: string,
  body: Record<string, unknown>,
  options?: { revalidateSeconds?: number }
): Promise<T> {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('Supabase config missing (SUPABASE_URL / SUPABASE_ANON_KEY)');

  const url = `${getRestBase(cfg.url)}/rpc/${fnName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    next: options?.revalidateSeconds ? { revalidate: options.revalidateSeconds } : undefined,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Supabase RPC failed (${res.status}): ${msg.slice(0, 160)}`);
  }

  return (await res.json()) as T;
}

