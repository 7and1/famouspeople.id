import { createMiddleware } from 'hono/factory';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { AppEnv } from '../types/app.js';

const redisUrl = process.env.UPSTASH_REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_TOKEN;

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

const rateLimiters = redis
  ? {
      default: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m') }),
      search: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m') }),
      heavy: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m') }),
      internal: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1000, '1 m') }),
    }
  : null;

const getClientIp = (c: any) => {
  const header = c.req.header('CF-Connecting-IP')
    || c.req.header('X-Forwarded-For')
    || c.req.header('X-Real-IP');
  if (header) {
    return header.split(',')[0].trim();
  }
  return 'unknown';
};

export const rateLimit = (tier: 'default' | 'search' | 'heavy' | 'internal' = 'default') => {
  return createMiddleware<AppEnv>(async (c, next) => {
    if (!rateLimiters) {
      await next();
      return;
    }

    const ip = getClientIp(c);
    const { success, limit, remaining, reset } = await rateLimiters[tier].limit(ip);

    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', reset.toString());

    if (!success) {
      return c.json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          retry_after: Math.ceil((reset - Date.now()) / 1000),
          request_id: c.get('requestId'),
        }
      }, 429);
    }

    await next();
  });
};
