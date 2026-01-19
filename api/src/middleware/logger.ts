import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types/app.js';
import logger from '../lib/logger.js';

export const requestLogger = createMiddleware<AppEnv>(async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  logger.info({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration_ms: duration,
    request_id: c.get('requestId'),
  });
});
