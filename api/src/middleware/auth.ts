import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import type { AppEnv } from '../types/app.js';

export const serviceRoleAuth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing token',
        request_id: c.get('requestId'),
      }
    }, 401);
  }

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    return c.json({
      error: {
        code: 'SERVER_CONFIG_ERROR',
        message: 'SUPABASE_JWT_SECRET not configured',
        request_id: c.get('requestId'),
      }
    }, 500);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verify(token, secret, 'HS256');
    if (payload.role !== 'service_role') {
      return c.json({
        error: {
          code: 'FORBIDDEN',
          message: 'Service role required',
          request_id: c.get('requestId'),
        }
      }, 403);
    }
    c.set('auth', payload);
    await next();
  } catch {
    return c.json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token verification failed',
        request_id: c.get('requestId'),
      }
    }, 401);
  }
});
