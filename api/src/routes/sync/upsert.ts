import { Hono } from 'hono';
import type { AppEnv } from '../../types/app.js';
import { z } from 'zod';
import { getServiceClient } from '../../lib/db.js';
import { serviceRoleAuth } from '../../middleware/auth.js';

const schema = z.object({
  identities: z.array(z.record(z.any())).min(1),
});

const upsert = new Hono<AppEnv>();

upsert.post('/sync/upsert', serviceRoleAuth, async (c) => {
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

  const supabase = await getServiceClient();
  const { error } = await supabase.from('identities').upsert(parsed.data.identities, { onConflict: 'fpid' });

  if (error) {
    return c.json({
      error: {
        code: 'UPSERT_FAILED',
        message: error.message,
        request_id: c.get('requestId'),
      }
    }, 500);
  }

  c.header('Cache-Control', 'no-store');
  return c.json({ data: { upserted: parsed.data.identities.length } }, 200);
});

export default upsert;
