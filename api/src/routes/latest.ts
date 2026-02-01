import { Hono } from 'hono';
import type { AppEnv } from '../types/app.js';
import { getPublicClient } from '../lib/db.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { paginationSchema } from '../lib/validators.js';
import { getLatestPeople } from '../services/latest.js';

const latest = new Hono<AppEnv>();

latest.get('/latest', rateLimit('default'), async (c) => {
  const parsed = paginationSchema.safeParse(c.req.query());
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
  const result = await getLatestPeople(supabase, parsed.data);

  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return c.json(result);
});

export default latest;

