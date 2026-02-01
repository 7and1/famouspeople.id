/**
 * Edge Rate Limiting Middleware
 * KV-based rate limiting optimized for Cloudflare Workers
 * Uses sliding window algorithm with ctx.waitUntil for non-blocking writes
 */

import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import type { AppEnv } from '../types/app.js';

// Rate limit tiers
interface RateLimitConfig {
  requests: number;
  windowSeconds: number;
}

const DEFAULT_TIERS: Record<string, RateLimitConfig> = {
  default: { requests: 60, windowSeconds: 60 },
  search: { requests: 30, windowSeconds: 60 },
  heavy: { requests: 10, windowSeconds: 60 },
  internal: { requests: 1000, windowSeconds: 60 },
  strict: { requests: 5, windowSeconds: 60 },
};

// KV key prefix for rate limit buckets
const RATE_LIMIT_PREFIX = 'rl:';

interface RateLimitState {
  count: number;
  windowStart: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  window: number;
}

/**
 * Get KV namespace for rate limiting
 */
const getKV = (): KVNamespace | null => {
  return (globalThis as any).KV_RATE_LIMIT || (globalThis as any).KV_CACHE || null;
};

/**
 * Get client IP from request headers
 */
const getClientId = (c: Context): string => {
  // Try CF-Connecting-IP first (Cloudflare-specific)
  const cfIp = c.req.header('CF-Connecting-IP');
  if (cfIp) return cfIp;

  // Fall back to X-Forwarded-For
  const forwarded = c.req.header('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Last resort: X-Real-IP
  const realIp = c.req.header('X-Real-IP');
  if (realIp) return realIp;

  // If no IP found, use a fallback based on path (allows some caching)
  return 'unknown';
};

/**
 * Generate rate limit key
 */
const generateKey = (identifier: string, tier: string, windowSeconds: number): string => {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  return `${RATE_LIMIT_PREFIX}${tier}:${identifier}:${window}`;
};

/**
 * Parse rate limit state from KV value
 */
const parseState = (value: string | null): RateLimitState | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as RateLimitState;
  } catch {
    return null;
  }
};

/**
 * Check and update rate limit using sliding window
 * Uses waitUntil for non-blocking KV writes
 */
const checkRateLimit = async (
  c: Context,
  identifier: string,
  config: RateLimitConfig,
  tier: string
): Promise<RateLimitResult> => {
  const kv = getKV();
  if (!kv) {
    // No KV available - allow request
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      resetAt: Date.now() + config.windowSeconds * 1000,
      window: config.windowSeconds,
    };
  }

  const key = generateKey(identifier, tier, config.windowSeconds);
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  try {
    // Get current state
    const stored = await kv.get(key, 'text');
    const state = parseState(stored as string | null);

    // Check if window has expired
    if (!state || now > state.resetAt) {
      // New window
      const newState: RateLimitState = {
        count: 1,
        windowStart: now,
        resetAt: now + windowMs,
      };

      const putPromise = kv.put(key, JSON.stringify(newState), {
        expirationTtl: config.windowSeconds,
      });

      if (c.executionCtx) {
        c.executionCtx.waitUntil(putPromise);
      } else {
        await putPromise;
      }

      return {
        success: true,
        limit: config.requests,
        remaining: config.requests - 1,
        resetAt: newState.resetAt,
        window: config.windowSeconds,
      };
    }

    // Check if limit exceeded
    if (state.count >= config.requests) {
      return {
        success: false,
        limit: config.requests,
        remaining: 0,
        resetAt: state.resetAt,
        window: config.windowSeconds,
      };
    }

    // Increment counter
    state.count += 1;

    const putPromise = kv.put(key, JSON.stringify(state), {
      expirationTtl: Math.ceil((state.resetAt - now) / 1000),
    });

    if (c.executionCtx) {
      c.executionCtx.waitUntil(putPromise);
    } else {
      await putPromise;
    }

    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - state.count,
      resetAt: state.resetAt,
      window: config.windowSeconds,
    };
  } catch (err) {
    console.warn('[EdgeRateLimit] Check failed:', err);
    // Fail open - allow request on error
    return {
      success: true,
      limit: config.requests,
      remaining: 1,
      resetAt: now + windowMs,
      window: config.windowSeconds,
    };
  }
};

/**
 * Create rate limiting middleware
 */
export const edgeRateLimit = (tier: keyof typeof DEFAULT_TIERS = 'default') => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const config = DEFAULT_TIERS[tier] || DEFAULT_TIERS.default;
    const identifier = getClientId(c);

    const result = await checkRateLimit(c, identifier, config, tier);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', result.limit.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, result.remaining).toString());
    c.header('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());
    c.header('X-RateLimit-Window', `${result.window}s`);

    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

      return c.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            retry_after: retryAfter,
            request_id: c.get('requestId'),
          },
        },
        429
      );
    }

    await next();
  });
};

/**
 * Create custom rate limiting middleware with specific config
 */
export const createEdgeRateLimit = (config: RateLimitConfig) => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const identifier = getClientId(c);
    const result = await checkRateLimit(c, identifier, config, 'custom');

    c.header('X-RateLimit-Limit', result.limit.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, result.remaining).toString());
    c.header('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());

    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

      return c.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            retry_after: retryAfter,
            request_id: c.get('requestId'),
          },
        },
        429
      );
    }

    await next();
  });
};

/**
 * Rate limit by custom identifier (e.g., API key)
 */
export const edgeRateLimitByKey = (getKey: (c: Context) => string, config?: RateLimitConfig) => {
  const rateConfig = config || DEFAULT_TIERS.default;

  return createMiddleware<AppEnv>(async (c, next) => {
    const identifier = getKey(c);
    const result = await checkRateLimit(c, identifier, rateConfig, 'keyed');

    c.header('X-RateLimit-Limit', result.limit.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, result.remaining).toString());
    c.header('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());

    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

      return c.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests for this API key',
            retry_after: retryAfter,
            request_id: c.get('requestId'),
          },
        },
        429
      );
    }

    await next();
  });
};

export default edgeRateLimit;
