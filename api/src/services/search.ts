import type { SupabaseClient } from '@supabase/supabase-js';

export interface SearchParams {
  q: string;
  type?: string;
  country?: string;
  occupation?: string;
  zodiac?: string;
  mbti?: string;
  gender?: string;
  birth_year_min?: number;
  birth_year_max?: number;
  net_worth_min?: number;
  is_alive?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}

const MAX_QUERY_LENGTH = 100;
const ALLOWED_QUERY_PATTERN = /^[\p{L}\p{N}\s\-'.]+$/u;

export const normalizeSearchParams = (params: SearchParams) => {
  const trimmed = params.q.trim();
  if (trimmed.length > MAX_QUERY_LENGTH) {
    throw new Error('Query too long');
  }
  if (!ALLOWED_QUERY_PATTERN.test(trimmed)) {
    throw new Error('Invalid characters in query');
  }
  return {
    ...params,
    q: trimmed,
    type: params.type || 'Person',
    sort: params.sort || 'relevance',
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  };
};

const applyFilters = (query: any, params: SearchParams) => {
  if (params.type) query.eq('type', params.type);
  if (params.country) query.contains('country', [params.country]);
  if (params.occupation) query.contains('occupation', [params.occupation]);
  if (params.zodiac) query.eq('zodiac', params.zodiac);
  if (params.mbti) query.eq('mbti', params.mbti);
  if (params.gender) query.eq('gender', params.gender);
  if (params.birth_year_min) query.gte('birth_date', `${params.birth_year_min}-01-01`);
  if (params.birth_year_max) query.lte('birth_date', `${params.birth_year_max}-12-31`);
  if (params.net_worth_min) query.gte('net_worth', params.net_worth_min);
  if (params.is_alive === true) query.is('death_date', null);
  if (params.is_alive === false) query.not('death_date', 'is', null);
  return query;
};

export const searchPeople = async (supabase: SupabaseClient, rawParams: SearchParams) => {
  const params = normalizeSearchParams(rawParams);

  // Try RPC-based search for trigram relevance when available
  // Execute all three RPCs in parallel for better performance
  const [searchResult, countResult, facetsResult] = await Promise.all([
    supabase.rpc('search_people', {
      q: params.q,
      type_filter: params.type,
      country_filter: params.country,
      occupation_filter: params.occupation,
      zodiac_filter: params.zodiac,
      mbti_filter: params.mbti,
      gender_filter: params.gender,
      birth_year_min: params.birth_year_min,
      birth_year_max: params.birth_year_max,
      net_worth_min: params.net_worth_min,
      is_alive: params.is_alive,
      sort: params.sort,
      limit_count: params.limit,
      offset_count: params.offset,
    }),
    supabase.rpc('search_people_count', {
      q: params.q,
      type_filter: params.type,
      country_filter: params.country,
      occupation_filter: params.occupation,
      zodiac_filter: params.zodiac,
      mbti_filter: params.mbti,
      gender_filter: params.gender,
      birth_year_min: params.birth_year_min,
      birth_year_max: params.birth_year_max,
      net_worth_min: params.net_worth_min,
      is_alive: params.is_alive,
    }),
    supabase.rpc('search_people_facets', {
      q: params.q,
      type_filter: params.type,
      country_filter: params.country,
      occupation_filter: params.occupation,
      zodiac_filter: params.zodiac,
      mbti_filter: params.mbti,
      gender_filter: params.gender,
      birth_year_min: params.birth_year_min,
      birth_year_max: params.birth_year_max,
      net_worth_min: params.net_worth_min,
      is_alive: params.is_alive,
    })
  ]);

  let data = searchResult.error ? null : searchResult.data;
  let total = countResult.data || 0;
  let facets: { country: { value: string; count: number }[]; zodiac: { value: string; count: number }[] } = {
    country: [],
    zodiac: [],
  };

  if (facetsResult.data) {
    facets = facetsResult.data as typeof facets;
  }

  const rpcError = searchResult.error;

  if (rpcError) {
    let query = supabase
      .from('identities')
      .select('fpid, slug, full_name, net_worth, height_cm, birth_date, occupation, country, zodiac, mbti, image_url', { count: 'exact' })
      .eq('is_published', true)
      .ilike('full_name', `%${params.q}%`);

    query = applyFilters(query, params);

    if (params.sort === 'net_worth:desc') query = query.order('net_worth', { ascending: false, nullsFirst: false });
    if (params.sort === 'birth_date:asc') query = query.order('birth_date', { ascending: true });
    if (params.sort === 'name:asc') query = query.order('full_name', { ascending: true });

    query = query.range(params.offset || 0, (params.offset || 0) + (params.limit || 20) - 1);

    const { data: rows, count } = await query;
    data = rows || [];
    total = count || 0;
  }

  return {
    data: (data || []).map((row: any) => ({
      ...row,
      occupation: row.occupation || [],
      country: row.country || [],
      relevance_score: row.relevance_score ?? null,
    })),
    meta: {
      total,
      page: Math.floor((params.offset || 0) / (params.limit || 20)) + 1,
      per_page: params.limit,
      has_next: (params.offset || 0) + (params.limit || 20) < total,
      facets,
    },
  };
};
