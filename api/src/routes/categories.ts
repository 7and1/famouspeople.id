import { Hono } from 'hono';
import type { AppEnv } from '../types/app.js';
import { z } from 'zod';
import { getPublicClient } from '../lib/db.js';
import { rateLimit } from '../middleware/rateLimit.js';

const categoriesQuerySchema = z.object({
  value: z.string().min(1),
  sort: z.string().optional().default('net_worth:desc'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const categoriesPathQuerySchema = z.object({
  sort: z.string().optional().default('net_worth:desc'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const listCategoryPeople = async (options: {
  type: string;
  value: string;
  sort: string;
  limit: number;
  offset: number;
}) => {
  const supabase = await getPublicClient();
  let query = supabase
    .from('identities')
    .select('fpid, slug, full_name, net_worth, occupation, image_url, birth_date, country, zodiac, mbti, height_cm', { count: 'exact' })
    .eq('is_published', true);

  if (options.type === 'occupation') {
    query = query.contains('occupation', [options.value]);
  } else if (options.type === 'country') {
    query = query.contains('country', [options.value]);
  } else if (options.type === 'zodiac') {
    query = query.eq('zodiac', options.value);
  } else if (options.type === 'mbti') {
    query = query.eq('mbti', options.value);
  } else {
    return {
      error: {
        code: 'INVALID_CATEGORY',
        message: `Unsupported category type '${options.type}'`,
      },
      status: 400 as const,
    };
  }

  if (options.sort === 'net_worth:desc') {
    query = query.order('net_worth', { ascending: false, nullsFirst: false });
  } else if (options.sort === 'birth_date:asc') {
    query = query.order('birth_date', { ascending: true });
  } else if (options.sort === 'name:asc') {
    query = query.order('full_name', { ascending: true });
  }

  query = query.range(options.offset, options.offset + options.limit - 1);

  const { data, count } = await query;

  return {
    data: (data || []).map((row: any) => ({
      ...row,
      occupation: row.occupation || [],
      country: row.country || [],
    })),
    meta: {
      total: count || 0,
      page: Math.floor(options.offset / options.limit) + 1,
      per_page: options.limit,
      has_next: (options.offset + options.limit) < (count || 0),
    },
    status: 200 as const,
  };
};

const categories = new Hono<AppEnv>();

categories.get('/categories/:type', rateLimit('heavy'), async (c) => {
  const { type } = c.req.param();
  const parsed = categoriesQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({
      error: {
        code: 'INVALID_QUERY',
        message: parsed.error.message,
        request_id: c.get('requestId'),
      }
    }, 400);
  }

  const result = await listCategoryPeople({
    type,
    value: parsed.data.value,
    sort: parsed.data.sort,
    limit: parsed.data.limit,
    offset: parsed.data.offset,
  });

  if (result.status !== 200) {
    return c.json({
      error: {
        ...result.error,
        request_id: c.get('requestId'),
      }
    }, result.status);
  }

  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

  return c.json({ data: result.data, meta: result.meta });
});

categories.get('/categories/:type/:value', rateLimit('heavy'), async (c) => {
  const { type, value } = c.req.param();
  const parsed = categoriesPathQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({
      error: {
        code: 'INVALID_QUERY',
        message: parsed.error.message,
        request_id: c.get('requestId'),
      }
    }, 400);
  }

  const result = await listCategoryPeople({
    type,
    value,
    sort: parsed.data.sort,
    limit: parsed.data.limit,
    offset: parsed.data.offset,
  });

  if (result.status !== 200) {
    return c.json({
      error: {
        ...result.error,
        request_id: c.get('requestId'),
      }
    }, result.status);
  }

  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return c.json({ data: result.data, meta: result.meta });
});

export default categories;
