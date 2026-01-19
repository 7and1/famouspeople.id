import { Hono } from 'hono';
import type { AppEnv } from '../types/app.js';
import { z } from 'zod';
import { purgeCache } from '../lib/cache.js';
import { serviceRoleAuth } from '../middleware/auth.js';

const schema = z.object({
  keys: z.array(z.string()).optional().default([]),
  pattern: z.string().optional(),
});

const cache = new Hono<AppEnv>();

cache.post('/cache/purge', serviceRoleAuth, async (c) => {
  const payload = await c.req.json().catch(() => null);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return c.json({
      error: {
        code: 'INVALID_BODY',
        message: parsed.error.message,
        request_id: c.get('requestId'),
      }
    }, 400);
  }

  const result = await purgeCache(parsed.data.keys, parsed.data.pattern);
  c.header('Cache-Control', 'no-store');
  return c.json({ purged: result.purged, skipped: result.skipped });
});

export default cache;
