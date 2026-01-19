import { Hono } from 'hono';
import type { AppEnv } from '../../types/app.js';
import { z } from 'zod';
import { getServiceClient } from '../../lib/db.js';
import { serviceRoleAuth } from '../../middleware/auth.js';
import { generateEmbeddings } from '../../services/embeddings.js';

const schema = z.object({
  fpids: z.array(z.string()).min(1),
});

const embeddings = new Hono<AppEnv>();

embeddings.post('/embeddings/generate', serviceRoleAuth, async (c) => {
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

  try {
    const supabase = await getServiceClient();
    const result = await generateEmbeddings(supabase, parsed.data.fpids);
    c.header('Cache-Control', 'no-store');
    return c.json({ data: result });
  } catch (error: any) {
    return c.json({
      error: {
        code: 'EMBEDDING_FAILED',
        message: error?.message || 'Embedding generation failed',
        request_id: c.get('requestId'),
      }
    }, 500);
  }
});

export default embeddings;
