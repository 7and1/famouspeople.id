import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateAge } from '../lib/format.js';

export interface PersonProfile {
  fpid: string;
  slug: string;
  full_name: string;
  type: string;
  net_worth: number | null;
  height_cm: number | null;
  birth_date: string | null;
  death_date: string | null;
  country: string[];
  mbti: string | null;
  zodiac: string | null;
  gender: string | null;
  occupation: string[];
  image_url: string | null;
  wikipedia_url: string | null;
  social_links: Record<string, string | null>;
  data_sources?: Record<string, unknown>;
  bio_summary: string | null;
  content_md?: string | null;
  fame_tier?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  age?: number | null;
  relationship_count?: number | null;
}

export const getPersonBySlug = async (
  supabase: SupabaseClient,
  slug: string,
  includeUnpublished = false
): Promise<PersonProfile | null> => {
  let query = supabase
    .from('identities')
    .select(
      'fpid, slug, full_name, type, net_worth, height_cm, birth_date, death_date, country, mbti, zodiac, gender, occupation, image_url, wikipedia_url, social_links, data_sources, bio_summary, content_md, fame_tier, created_at, updated_at'
    )
    .eq('slug', slug);

  if (!includeUnpublished) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error || !data) return null;

  const age = calculateAge(data.birth_date, data.death_date);

  return {
    ...data,
    country: data.country || [],
    occupation: data.occupation || [],
    social_links: data.social_links || {},
    data_sources: data.data_sources || {},
    age,
  };
};

export const getRelationshipCount = async (
  supabase: SupabaseClient,
  fpid: string
): Promise<number> => {
  const { count } = await supabase
    .from('relationships')
    .select('id', { count: 'exact', head: true })
    .or(`source_fpid.eq.${fpid},target_fpid.eq.${fpid}`);

  return count || 0;
};

export const getPeopleBySlugs = async (
  supabase: SupabaseClient,
  slugs: string[],
  includeUnpublished = false
): Promise<PersonProfile[]> => {
  if (!slugs.length) return [];

  let query = supabase
    .from('identities')
    .select(
      'fpid, slug, full_name, type, net_worth, height_cm, birth_date, death_date, country, mbti, zodiac, gender, occupation, image_url, wikipedia_url, social_links, data_sources, bio_summary, fame_tier, created_at, updated_at'
    )
    .in('slug', slugs);

  if (!includeUnpublished) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const map = new Map(data.map((row) => [row.slug, row]));

  return slugs
    .map((slug) => map.get(slug))
    .filter(Boolean)
    .map((row) => ({
      ...row,
      country: row!.country || [],
      occupation: row!.occupation || [],
      social_links: row!.social_links || {},
      data_sources: (row as unknown as { data_sources?: Record<string, unknown> }).data_sources || {},
      age: calculateAge(row!.birth_date, row!.death_date),
    })) as PersonProfile[];
};
