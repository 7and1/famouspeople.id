import { Hono } from 'hono';
import type { AppEnv } from '../types/app.js';
import { getPublicClient } from '../lib/db.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { compareQuerySchema } from '../lib/validators.js';
import { comparePeople } from '../services/compare.js';

const compare = new Hono<AppEnv>();

compare.get('/compare', rateLimit('heavy'), async (c) => {
  const parsed = compareQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({
      error: {
        code: 'INVALID_QUERY',
        message: parsed.error.message,
        request_id: c.get('requestId'),
      }
    }, 400);
  }

  const slugs = parsed.data.ids.split(',').map((id) => id.trim()).filter(Boolean);
  if (slugs.length < 2 || slugs.length > 5) {
    return c.json({
      error: {
        code: 'INVALID_COMPARE_COUNT',
        message: `Compare requires 2-5 people, got ${slugs.length}`,
        request_id: c.get('requestId'),
      }
    }, 400);
  }

  const supabase = await getPublicClient();
  const result = await comparePeople(supabase, slugs);

  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return c.json({ data: result });
});

export default compare;
