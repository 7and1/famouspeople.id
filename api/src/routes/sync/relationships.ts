import { Hono } from 'hono';
import type { AppEnv } from '../../types/app.js';
import { z } from 'zod';
import { getServiceClient } from '../../lib/db.js';
import { serviceRoleAuth } from '../../middleware/auth.js';

const schema = z.object({
  relationships: z.array(z.object({
    source_fpid: z.string(),
    target_fpid: z.string(),
    relation_type: z.string(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    details: z.record(z.any()).optional(),
  })).min(1),
  replace: z.boolean().optional().default(true),
});

const relationships = new Hono<AppEnv>();

relationships.post('/sync/relationships', serviceRoleAuth, async (c) => {
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
  const sourceFpids = Array.from(new Set(parsed.data.relationships.map((r) => r.source_fpid)));

  if (parsed.data.replace && sourceFpids.length) {
    await supabase.from('relationships').delete().in('source_fpid', sourceFpids);
  }

  const { error } = await supabase.from('relationships').insert(parsed.data.relationships);

  if (error) {
    return c.json({
      error: {
        code: 'RELATIONSHIP_SYNC_FAILED',
        message: error.message,
        request_id: c.get('requestId'),
      }
    }, 500);
  }

  c.header('Cache-Control', 'no-store');
  return c.json({ data: { inserted: parsed.data.relationships.length } });
});

export default relationships;
