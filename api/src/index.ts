import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
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
import latestRoutes from './routes/latest.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/logger.js';
import { securityHeaders } from './middleware/security.js';
import { timing } from './middleware/timing.js';
import { getConnectionHealth } from './lib/db.js';
import { ErrorCode, createError } from './lib/errors.js';
import { validateEnvForRuntime } from './lib/env.js';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export const createApp = () => {
  validateEnvForRuntime();
  const app = new Hono<AppEnv>();

  app.use('*', requestId);
  app.use('*', requestLogger);
  app.use('*', timing);
  app.use('*', bodyLimit({ maxSize: 10 * 1024 * 1024 })); // 10MB
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
  app.use('/api/*', cors({
    origin: (origin) => {
      if (!origin) return null; // Reject requests without Origin
      return allowedOrigins.includes(origin) ? origin : null;
    },
  }));

  app.use('*', securityHeaders);

  app.get('/health', async (c) => {
    const dbHealth = await getConnectionHealth();
    const isHealthy = dbHealth.public && dbHealth.service;

    return c.json({
      status: isHealthy ? 'healthy' : 'degraded',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealth.public ? 'connected' : 'disconnected',
        cache: 'ok', // Cache is optional, always report ok
      },
    }, isHealthy ? 200 : 503);
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
  app.route('/api/v1', latestRoutes);

  app.notFound((c) => c.json({
    error: createError(
      ErrorCode.NOT_FOUND,
      'Route not found',
      c.get('requestId')
    )
  }, 404));

  app.onError((err, c) => {
    const isDev = process.env.NODE_ENV !== 'production';
    return c.json({
      error: createError(
        ErrorCode.INTERNAL_ERROR,
        isDev ? err?.message || 'An unexpected error occurred' : 'An unexpected error occurred',
        c.get('requestId')
      )
    }, 500);
  });

  return app;
};

const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 8006);
  const server = serve({
    fetch: app.fetch,
    port,
  });
  console.log(`API running on http://localhost:${port}`);

  // Graceful shutdown
  const shutdown = () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
