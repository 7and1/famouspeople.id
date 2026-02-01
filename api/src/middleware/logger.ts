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

/**
 * Log security events for monitoring
 */
export const logSecurityEvent = (
  event: 'rate_limit_violation' | 'auth_failure' | 'unauthorized_access',
  details: {
    ip?: string;
    path: string;
    method: string;
    user_agent?: string;
    reason?: string;
    request_id?: string;
  }
): void => {
  logger.warn({
    event: 'security_event',
    security_event_type: event,
    ...details,
  });
};
