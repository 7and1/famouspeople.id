/**
 * Cloudflare Workers entry point
 * This is a separate entry point that doesn't import Node.js dependencies
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
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

  // Optional: Rate limiting
  UPSTASH_REDIS_URL?: string;
  UPSTASH_REDIS_TOKEN?: string;

  // Optional: Vector embeddings
  OPENAI_API_KEY?: string;
  OPENAI_EMBEDDING_MODEL?: string;

  // Cloudflare KV bindings (optional)
  KV_CACHE?: KVNamespace;
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

  // Store KV binding globally for access in services
  if (env.KV_CACHE) {
    (globalThis as any).KV_CACHE = env.KV_CACHE;
  }

  app.use('*', requestId);
  app.use('*', requestLogger);

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

  app.get('/health', (c) => c.json({ status: 'ok' }));

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

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    const app = createApp(env);
    return app.fetch(request);
  },
};
