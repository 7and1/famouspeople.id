import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types/app.js';
import logger from '../lib/logger.js';

const SLOW_REQUEST_THRESHOLD = 1000; // ms

export const timing = createMiddleware<AppEnv>(async (c, next) => {
  const start = performance.now();

  await next();

  const duration = performance.now() - start;
  const durationMs = Math.round(duration * 100) / 100;

  // Add Server-Timing header
  c.header('Server-Timing', `total;dur=${durationMs}`);

  // Log slow requests
  if (duration > SLOW_REQUEST_THRESHOLD) {
    logger.warn({
      event: 'slow_request',
      method: c.req.method,
      path: c.req.path,
      duration_ms: durationMs,
      threshold_ms: SLOW_REQUEST_THRESHOLD,
      request_id: c.get('requestId'),
    });
  }
});
