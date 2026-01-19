import { Hono } from 'hono';
import type { AppEnv } from '../types/app.js';
import { z } from 'zod';
import { getPublicClient } from '../lib/db.js';
import { rateLimit } from '../middleware/rateLimit.js';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

const birthdays = new Hono<AppEnv>();

birthdays.get('/birthdays/today', rateLimit('heavy'), async (c) => {
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
  const { data, error } = await supabase.rpc('get_birthdays_today', {
    limit_count: parsed.data.limit,
    offset_count: parsed.data.offset,
  });

  if (error) {
    return c.json({
      error: {
        code: 'BIRTHDAY_QUERY_FAILED',
        message: error.message,
        request_id: c.get('requestId'),
      }
    }, 500);
  }

  c.header('Cache-Control', 'public, max-age=3600');
  return c.json({
    data: data || [],
    meta: {
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    }
  });
});

birthdays.get('/birthdays/:month', rateLimit('heavy'), async (c) => {
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

  const monthParam = c.req.param('month').toLowerCase();
  const monthMap: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };

  const monthNum = monthMap[monthParam] || Number(monthParam);
  if (!monthNum || monthNum < 1 || monthNum > 12) {
    return c.json({
      error: {
        code: 'INVALID_MONTH',
        message: `Invalid month '${monthParam}'`,
        request_id: c.get('requestId'),
      }
    }, 400);
  }

  const supabase = await getPublicClient();
  const { data, error } = await supabase.rpc('get_birthdays_month', {
    month_num: monthNum,
    limit_count: parsed.data.limit,
    offset_count: parsed.data.offset,
  });

  if (error) {
    return c.json({
      error: {
        code: 'BIRTHDAY_QUERY_FAILED',
        message: error.message,
        request_id: c.get('requestId'),
      }
    }, 500);
  }

  c.header('Cache-Control', 'public, max-age=3600');
  return c.json({
    data: data || [],
    meta: {
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      month: monthNum,
    }
  });
});

export default birthdays;
