import type { SupabaseClient } from '@supabase/supabase-js';
import { getReleasedTiers } from '../lib/release.js';

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

export interface SitemapPersonRow {
  slug: string;
  updated_at: string | null;
  created_at: string | null;
  full_name: string;
  image_url: string | null;
  occupation: string[] | null;
}

export const getSitemapDataPage = async (
  supabase: SupabaseClient,
  page: number,
  perPage = 50000
) => {
  const tiers = getReleasedTiers();
  const offset = (page - 1) * perPage;

  const { data, count } = await supabase
    .from('identities')
    .select('slug, updated_at, created_at, full_name, image_url, occupation', { count: 'exact' })
    .eq('is_published', true)
    .in('fame_tier', tiers)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + perPage - 1);

  return {
    people: (data || []).map((row: SitemapPersonRow) => ({
      slug: row.slug,
      updated_at: row.updated_at,
      created_at: row.created_at,
      full_name: row.full_name,
      image_url: row.image_url,
      occupation: row.occupation || [],
    })),
    total: count || 0,
    per_page: perPage,
    page,
  };
};
