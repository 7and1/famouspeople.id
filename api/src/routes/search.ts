import { Hono } from 'hono';
import type { AppEnv } from '../types/app.js';
import { getPublicClient } from '../lib/db.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { searchQuerySchema } from '../lib/validators.js';
import { searchPeople } from '../services/search.js';

const search = new Hono<AppEnv>();

search.get('/search', rateLimit('search'), async (c) => {
  const parsed = searchQuerySchema.safeParse(c.req.query());

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
  const result = await searchPeople(supabase, parsed.data);

  c.header('Cache-Control', 'public, max-age=120, stale-while-revalidate=60');

  return c.json(result);
});

export default search;
