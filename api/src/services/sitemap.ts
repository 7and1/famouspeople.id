import type { SupabaseClient } from '@supabase/supabase-js';

export const getReleasedTiers = (now: Date = new Date()) => {
  const launchDate = new Date('2026-02-01T00:00:00Z');
  const daysSinceLaunch = Math.floor((now.getTime() - launchDate.getTime()) / 86400000);

  if (daysSinceLaunch >= 21) return ['S', 'A', 'B', 'C'];
  if (daysSinceLaunch >= 14) return ['S', 'A', 'B'];
  if (daysSinceLaunch >= 7) return ['S', 'A'];
  return ['S'];
};

export const getSitemapPage = async (
  supabase: SupabaseClient,
  page: number,
  perPage = 50000
) => {
  const tiers = getReleasedTiers();
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('identities')
    .select('slug, updated_at', { count: 'exact' })
    .eq('is_published', true)
    .in('fame_tier', tiers)
    .order('updated_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  const { data, count } = await query;

  return {
    urls: (data || []).map((row: any) => ({
      slug: row.slug,
      lastmod: row.updated_at,
    })),
    total: count || 0,
  };
};
