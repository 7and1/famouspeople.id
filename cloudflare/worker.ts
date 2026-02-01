/**
 * Cloudflare Workers entry point
 * Optimized for edge runtime with compression, caching, and rate limiting
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';
import type { AppEnv } from './types/app.js';
import peopleRoutes from './routes/people.js';
import searchRoutes from './routes/search.js';
import rankingsRoutes from './routes/rankings.js';
import compareRoutes from './routes/compare.js';
import categoriesRoutes from './routes/categories.js';
import syncUpsertRoutes from './routes/sync/upsert.js';
import syncRelationshipsRoutes from './routes/sync/relationships.js';
import embeddingsRoutes from './routes/sync/embeddings.js';
import cacheRoutes from './routes/cache.js';
import sitemapRoutes from './routes/sitemap.js';
import birthdaysRoutes from './routes/birthdays.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/logger.js';
import { edgeRateLimit } from './middleware/edgeRateLimit.js';
import { getOrCompute, generateETag, isClientCacheFresh } from './lib/edge-cache.js';

export interface Env {
  // Supabase Configuration
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_JWT_SECRET?: string;

  // Database
  DATABASE_URL?: string;
  DATABASE_SCHEMA?: string;

  // API Configuration
  ALLOWED_ORIGINS?: string;
  LOG_LEVEL?: string;
  SITE_URL?: string;

  // Optional: Rate limiting (legacy Redis)
  UPSTASH_REDIS_URL?: string;
  UPSTASH_REDIS_TOKEN?: string;

  // Optional: Vector embeddings
  OPENAI_API_KEY?: string;
  OPENAI_EMBEDDING_MODEL?: string;

  // Cloudflare KV bindings
  KV_CACHE?: KVNamespace;
  KV_RATE_LIMIT?: KVNamespace;

  // Cloudflare R2
  R2_ASSETS?: R2Bucket;

  // Analytics
  ANALYTICS?: AnalyticsEngineDataset;
}

const createApp = (env: Env) => {
  const app = new Hono<AppEnv>();

  // Set environment variables for services that expect process.env
  (globalThis as any).process = {
    env: {
      NODE_ENV: 'production',
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY || '',
      SUPABASE_JWT_SECRET: env.SUPABASE_JWT_SECRET || '',
      DATABASE_URL: env.DATABASE_URL || '',
      DATABASE_SCHEMA: env.DATABASE_SCHEMA || 'public',
      ALLOWED_ORIGINS: env.ALLOWED_ORIGINS || 'https://famouspeople.id,https://www.famouspeople.id',
      LOG_LEVEL: env.LOG_LEVEL || 'info',
      SITE_URL: env.SITE_URL || 'https://famouspeople.id',
      UPSTASH_REDIS_URL: env.UPSTASH_REDIS_URL || '',
      UPSTASH_REDIS_TOKEN: env.UPSTASH_REDIS_TOKEN || '',
      OPENAI_API_KEY: env.OPENAI_API_KEY || '',
      OPENAI_EMBEDDING_MODEL: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
    },
  };

  // Store KV bindings globally for access in services
  if (env.KV_CACHE) {
    (globalThis as any).KV_CACHE = env.KV_CACHE;
  }
  if (env.KV_RATE_LIMIT) {
    (globalThis as any).KV_RATE_LIMIT = env.KV_RATE_LIMIT;
  }

  app.use('*', requestId);
  app.use('*', requestLogger);

  // Compression middleware - gzip responses
  app.use('*', compress({
    encoding: 'gzip',
    threshold: 1024, // Only compress responses > 1KB
  }));

  const allowedOrigins = (env.ALLOWED_ORIGINS || 'https://famouspeople.id,https://www.famouspeople.id')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use('/api/*', cors({
    origin: (origin) => {
      if (!origin) return '*';
      if (!allowedOrigins.length) return '*';
      return allowedOrigins.includes(origin) ? origin : '';
    },
  }));

  // Edge rate limiting by endpoint type
  app.use('/api/v1/search/*', edgeRateLimit('search'));
  app.use('/api/v1/compare', edgeRateLimit('heavy'));
  app.use('/api/v1/people/*/similar', edgeRateLimit('heavy'));
  app.use('/api/v1/sync/*', edgeRateLimit('internal'));
  app.use('/api/v1/*', edgeRateLimit('default'));

  // Health check with cache headers
  app.get('/health', (c) => {
    c.header('Cache-Control', 'public, max-age=10');
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  app.route('/api/v1', peopleRoutes);
  app.route('/api/v1', searchRoutes);
  app.route('/api/v1', rankingsRoutes);
  app.route('/api/v1', compareRoutes);
  app.route('/api/v1', categoriesRoutes);
  app.route('/api/v1', syncUpsertRoutes);
  app.route('/api/v1', syncRelationshipsRoutes);
  app.route('/api/v1', embeddingsRoutes);
  app.route('/api/v1', cacheRoutes);
  app.route('/api/v1', sitemapRoutes);
  app.route('/api/v1', birthdaysRoutes);

  app.notFound((c) => c.json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      request_id: c.get('requestId'),
    }
  }, 404));

  app.onError((err, c) => {
    // Log to analytics if available
    const analytics = (c.env as any)?.ANALYTICS;
    if (analytics) {
      c.executionCtx.waitUntil(
        analytics.writeDataPoint({
          blobs: [c.req.path, err.message || 'unknown'],
          doubles: [1],
          indexes: ['error'],
        }).catch(() => {})
      );
    }

    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'An unexpected error occurred',
        request_id: c.get('requestId'),
      }
    }, 500);
  });

  return app;
};

// Cache helper for route handlers
export const withCache = <T extends object>(
  handler: (c: any) => Promise<T>,
  cacheKey: string | ((c: any) => string),
  ttlSeconds?: number
) => {
  return async (c: any) => {
    const key = typeof cacheKey === 'function' ? cacheKey(c) : cacheKey;

    // Try to get from cache
    const { entry } = await import('./lib/edge-cache.js').then(m => m.getCached<T>(key));

    if (entry) {
      // Check ETag for conditional requests
      const etag = generateETag(entry.value);
      if (isClientCacheFresh(c, etag)) {
        return c.body(null, 304);
      }
      c.header('ETag', etag);
      c.header('X-Cache', 'HIT');
      c.header('Cache-Control', `public, max-age=${ttlSeconds || 300}`);
      return c.json(entry.value);
    }

    // Execute handler
    const result = await handler(c);

    // Store in cache using waitUntil
    const etag = generateETag(result);
    c.header('ETag', etag);
    c.header('X-Cache', 'MISS');
    c.header('Cache-Control', `public, max-age=${ttlSeconds || 300}`);

    await setCached(c, key, result, { ttlSeconds });

    return c.json(result);
  };
};

// Import needed for withCache
import { getCached, setCached } from './lib/edge-cache.js';

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    const app = createApp(env);
    // Pass execution context through env for access in handlers
    return app.fetch(request, env, ctx);
  },
};
