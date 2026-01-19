/**
 * Cloudflare Workers entry point
 * Adapts the Hono app for Cloudflare's edge runtime
 */

import { createApp } from './index.js';

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

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    // Inject Cloudflare env variables into process.env for compatibility
    (globalThis as any).process = {
      ...((globalThis as any).process || {}),
      env: {
        NODE_ENV: 'production',
        PORT: '8006',
        SUPABASE_URL: env.SUPABASE_URL,
        SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_JWT_SECRET: env.SUPABASE_JWT_SECRET,
        DATABASE_URL: env.DATABASE_URL,
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

    // Store KV binding in global for access in services
    if (env.KV_CACHE) {
      (globalThis as any).KV_CACHE = env.KV_CACHE;
    }

    const app = createApp();
    return app.fetch(request);
  },
};
