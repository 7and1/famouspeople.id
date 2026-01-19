import type { SupabaseClient } from '@supabase/supabase-js';
import { formatCurrencyShort } from '../lib/format.js';

const normalizeCategory = (category: string, sub?: string) => {
  if (category === 'zodiac' && sub) return `zodiac:${sub}`;
  if (category === 'country' && sub) return `country:${sub}`;
  if (category === 'mbti' && sub) return `mbti:${sub}`;
  return category;
};

export const getRankings = async (
  supabase: SupabaseClient,
  category: string,
  subcategory: string | undefined,
  limit: number,
  offset: number
) => {
  const normalized = normalizeCategory(category, subcategory);
  let query = supabase
    .from('identities')
    .select('fpid, slug, full_name, net_worth, height_cm, birth_date', { count: 'exact' })
    .eq('is_published', true);

  if (normalized === 'net-worth') {
    query = query.not('net_worth', 'is', null).order('net_worth', { ascending: false, nullsFirst: false });
  } else if (normalized === 'height') {
    query = query.not('height_cm', 'is', null).order('height_cm', { ascending: false, nullsFirst: false });
  } else if (normalized.startsWith('zodiac:')) {
    const sign = normalized.split(':')[1];
    query = query.eq('zodiac', sign).order('birth_date', { ascending: true });
  } else if (normalized.startsWith('country:')) {
    const code = normalized.split(':')[1];
    query = query.contains('country', [code]).order('net_worth', { ascending: false, nullsFirst: false });
  } else if (normalized.startsWith('mbti:')) {
    const type = normalized.split(':')[1];
    query = query.eq('mbti', type).order('net_worth', { ascending: false, nullsFirst: false });
  } else if (normalized === 'age') {
    query = query.is('death_date', null).not('birth_date', 'is', null).order('birth_date', { ascending: true });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count } = await query;

  const results = (data || []).map((row: any, index: number) => {
    let value: number | null = null;
    let formatted: string | null = null;

    if (normalized === 'net-worth') {
      value = row.net_worth;
      formatted = value !== null ? formatCurrencyShort(value) : null;
    }
    if (normalized === 'height') {
      value = row.height_cm;
      formatted = value !== null ? `${value} cm` : null;
    }
    if (normalized === 'age') {
      value = row.birth_date
        ? new Date().getFullYear() - new Date(row.birth_date).getFullYear()
        : null;
      formatted = value !== null ? `${value} years` : null;
    }

    if (!formatted) {
      formatted = value !== null ? String(value) : null;
    }

    return {
      rank: offset + index + 1,
      fpid: row.fpid,
      slug: row.slug,
      full_name: row.full_name,
      value: value ?? row.net_worth ?? row.height_cm ?? null,
      formatted_value: formatted,
    };
  });

  return {
    data: results,
    meta: {
      category: normalized,
      total: count || 0,
      limit,
      updated_at: new Date().toISOString(),
    },
  };
};
