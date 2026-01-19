import { Hono } from 'hono';
import type { AppEnv } from '../types/app.js';
import { getPublicClient } from '../lib/db.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { rankingsQuerySchema } from '../lib/validators.js';
import { getRankings } from '../services/rankings.js';

const rankings = new Hono<AppEnv>();

rankings.get('/rankings/:category', rateLimit('heavy'), async (c) => {
  const { category } = c.req.param();
  const parsed = rankingsQuerySchema.safeParse(c.req.query());
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
  const result = await getRankings(supabase, category, undefined, parsed.data.limit, parsed.data.offset);

  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return c.json(result);
});

rankings.get('/rankings/:category/:subcategory', rateLimit('heavy'), async (c) => {
  const { category, subcategory } = c.req.param();
  const parsed = rankingsQuerySchema.safeParse(c.req.query());
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
  const result = await getRankings(supabase, category, subcategory, parsed.data.limit, parsed.data.offset);

  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return c.json(result);
});

export default rankings;
