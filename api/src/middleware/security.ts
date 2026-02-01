import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types/app.js';

/**
 * Security headers middleware
 * Adds recommended security headers to all responses
 */
export const securityHeaders = createMiddleware<AppEnv>(async (c, next) => {
  await next();

  // Prevent MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  c.header('X-Frame-Options', 'DENY');

  // XSS protection (legacy browsers)
  c.header('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  c.header(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );

  // Strict transport security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
});

/**
 * Content Security Policy for API responses (non-HTML)
 */
export const apiCsp = createMiddleware<AppEnv>(async (c, next) => {
  await next();

  // Restrictive CSP for API endpoints that shouldn't serve HTML
  c.header(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
  );
});
