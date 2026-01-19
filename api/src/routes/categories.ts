import { Hono } from 'hono';
import type { AppEnv } from '../types/app.js';
import { z } from 'zod';
import { getPublicClient } from '../lib/db.js';
import { rateLimit } from '../middleware/rateLimit.js';

const querySchema = z.object({
  value: z.string().min(1),
  sort: z.string().optional().default('net_worth:desc'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const categories = new Hono<AppEnv>();

categories.get('/categories/:type', rateLimit('heavy'), async (c) => {
  const { type } = c.req.param();
  const parsed = querySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({
      error: {
        code: 'INVALID_QUERY',
        message: parsed.error.message,
        request_id: c.get('requestId'),
      }
    }, 400);
  }

  const supabase = await getPublicClient();
  let query = supabase
    .from('identities')
    .select('fpid, slug, full_name, net_worth, occupation, image_url, birth_date, country, zodiac, mbti, height_cm', { count: 'exact' })
    .eq('is_published', true);

  if (type === 'occupation') {
    query = query.contains('occupation', [parsed.data.value]);
  } else if (type === 'country') {
    query = query.contains('country', [parsed.data.value]);
  } else if (type === 'zodiac') {
    query = query.eq('zodiac', parsed.data.value);
  } else if (type === 'mbti') {
    query = query.eq('mbti', parsed.data.value);
  } else {
    return c.json({
      error: {
        code: 'INVALID_CATEGORY',
        message: `Unsupported category type '${type}'`,
        request_id: c.get('requestId'),
      }
    }, 400);
  }

  if (parsed.data.sort === 'net_worth:desc') {
    query = query.order('net_worth', { ascending: false, nullsFirst: false });
  } else if (parsed.data.sort === 'birth_date:asc') {
    query = query.order('birth_date', { ascending: true });
  } else if (parsed.data.sort === 'name:asc') {
    query = query.order('full_name', { ascending: true });
  }

  query = query.range(parsed.data.offset, parsed.data.offset + parsed.data.limit - 1);

  const { data, count } = await query;

  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

  return c.json({
    data: (data || []).map((row: any) => ({
      ...row,
      occupation: row.occupation || [],
      country: row.country || [],
    })),
    meta: {
      total: count || 0,
      page: Math.floor(parsed.data.offset / parsed.data.limit) + 1,
      per_page: parsed.data.limit,
      has_next: (parsed.data.offset + parsed.data.limit) < (count || 0),
    }
  });
});

export default categories;
