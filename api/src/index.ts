import { Hono } from 'hono';
import { cors } from 'hono/cors';
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
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/logger.js';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export const createApp = () => {
  const app = new Hono<AppEnv>();

  app.use('*', requestId);
  app.use('*', requestLogger);
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
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

const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 8006);
  serve({
    fetch: app.fetch,
    port,
  });
  console.log(`API running on http://localhost:${port}`);
}

export default app;
