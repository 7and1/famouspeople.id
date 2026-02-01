import type { SupabaseClient } from '@supabase/supabase-js';
import { getReleasedTiers } from '../lib/release.js';

export interface LatestPerson {
  fpid: string;
  slug: string;
  full_name: string;
  net_worth: number | null;
  height_cm: number | null;
  birth_date: string | null;
  occupation: string[];
  image_url: string | null;
  bio_summary: string | null;
  zodiac: string | null;
  mbti: string | null;
  created_at: string | null;
  updated_at: string | null;
  fame_tier: string | null;
}

export const getLatestPeople = async (
  supabase: SupabaseClient,
  options: { limit: number; offset: number }
) => {
  const tiers = getReleasedTiers();

  const { data, count } = await supabase
    .from('identities')
    .select(
      'fpid, slug, full_name, net_worth, height_cm, birth_date, occupation, image_url, bio_summary, zodiac, mbti, created_at, updated_at, fame_tier',
      { count: 'exact' }
    )
    .eq('is_published', true)
    .in('fame_tier', tiers)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .range(options.offset, options.offset + options.limit - 1);

  return {
    data: (data || []).map((row: any) => ({
      ...row,
      occupation: row.occupation || [],
    })) as LatestPerson[],
    meta: {
      total: count || 0,
      page: Math.floor(options.offset / options.limit) + 1,
      per_page: options.limit,
      has_next: (options.offset + options.limit) < (count || 0),
      updated_at: new Date().toISOString(),
    },
  };
};

