import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types/app.js';

export const requestId = createMiddleware<AppEnv>(async (c, next) => {
  const existing = c.req.header('X-Request-ID');
  const id = existing && existing.trim() ? existing : crypto.randomUUID();
  c.set('requestId', id);
  c.header('X-Request-ID', id);
  await next();
});
