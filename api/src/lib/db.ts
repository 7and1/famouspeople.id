import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import logger from './logger.js';

type ClientType = 'public' | 'service';

interface CachedClient {
  client: SupabaseClient;
  lastValidated: number;
  isValid: boolean;
}

let cachedClients: Partial<Record<ClientType, CachedClient>> = {};

const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const SLOW_QUERY_THRESHOLD = 500; // ms

/**
 * Log slow queries for monitoring
 */
const logSlowQuery = (
  operation: string,
  table: string,
  durationMs: number,
  details?: Record<string, unknown>
): void => {
  logger.warn({
    event: 'slow_query',
    operation,
    table,
    duration_ms: Math.round(durationMs * 100) / 100,
    threshold_ms: SLOW_QUERY_THRESHOLD,
    ...details,
  });
};

/**
 * Wrap a query function to measure execution time
 */
export const timedQuery = async <T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>,
  details?: Record<string, unknown>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await queryFn();
    const duration = performance.now() - start;
    if (duration > SLOW_QUERY_THRESHOLD) {
      logSlowQuery(operation, table, duration, details);
    }
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error({
      event: 'query_error',
      operation,
      table,
      duration_ms: Math.round(duration * 100) / 100,
      error: error instanceof Error ? error.message : 'Unknown error',
      ...details,
    });
    throw error;
  }
};

/**
 * Validate Supabase connection with simple query
 */
const validateConnection = async (client: SupabaseClient): Promise<boolean> => {
  const start = performance.now();
  try {
    // Try a simple table query first
    const { error: tableError } = await client
      .from('identities')
      .select('fpid')
      .limit(1);
    const duration = performance.now() - start;
    if (duration > SLOW_QUERY_THRESHOLD) {
      logSlowQuery('validateConnection', 'identities', duration);
    }
    return !tableError;
  } catch {
    // Connection validation failed, but client may still work for some operations
    return false;
  }
};

/**
 * Build Supabase client with optimized configuration
 * Includes pgbouncer support for connection pooling
 */
const buildSupabaseClient = (key: string): SupabaseClient => {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error('SUPABASE_URL not configured');
  }

  // Check if using connection pooler (port 6543)
  const dbUrl = process.env.DATABASE_URL;
  const isUsingPooler = dbUrl?.includes(':6543') ?? false;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch,
    },
    // Enable pgbouncer mode when using connection pooler
    ...(isUsingPooler && {
      db: {
        schema: process.env.DATABASE_SCHEMA || 'public',
      },
    }),
  }) as SupabaseClient;
};

/**
 * Get or create a cached client with connection validation
 * Implements graceful degradation for connection failures
 */
const getClient = async (type: ClientType): Promise<SupabaseClient> => {
  const now = Date.now();
  const envKey = type === 'public' ? 'SUPABASE_ANON_KEY' : 'SUPABASE_SERVICE_ROLE_KEY';
  const fallbackKey = type === 'public' ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_ANON_KEY';

  const key = process.env[envKey] || process.env[fallbackKey];
  if (!key) {
    throw new Error(`${envKey} or ${fallbackKey} not configured`);
  }

  // Check cache and validate
  const cached = cachedClients[type];
  const needsValidation =
    !cached ||
    !cached.isValid ||
    now - cached.lastValidated > HEALTH_CHECK_INTERVAL;

  if (cached && !needsValidation) {
    return cached.client;
  }

  // Create new client
  const client = buildSupabaseClient(key);

  // Validate connection (non-blocking)
  let isValid = true;
  try {
    isValid = await validateConnection(client);
    if (!isValid) {
      console.warn('[DB] Connection validation failed, client may have limited functionality');
    }
  } catch {
    console.warn('[DB] Connection validation skipped');
  }

  // Cache the client
  cachedClients[type] = {
    client,
    lastValidated: now,
    isValid,
  };

  return client;
};

/**
 * Get public Supabase client (uses ANON_KEY)
 */
export const getPublicClient = (): Promise<SupabaseClient> => {
  return getClient('public');
};

/**
 * Get service role Supabase client (bypasses RLS)
 */
export const getServiceClient = (): Promise<SupabaseClient> => {
  return getClient('service');
};

/**
 * Force revalidation of all cached connections
 * Call this after detecting connection issues
 */
export const revalidateConnections = async (): Promise<void> => {
  for (const type of ['public', 'service'] as ClientType[]) {
    const cached = cachedClients[type];
    if (cached?.client) {
      cached.isValid = await validateConnection(cached.client);
      cached.lastValidated = Date.now();
    }
  }
};

/**
 * Clear all cached connections
 * Call this on shutdown or before redeployment
 */
export const closeConnections = (): void => {
  cachedClients = {};
};

/**
 * Health check endpoint handler
 * Returns connection status for all clients
 */
export const getConnectionHealth = async (): Promise<{
  public: boolean;
  service: boolean;
}> => {
  const result = {
    public: false,
    service: false,
  };

  try {
    const publicClient = await getPublicClient();
    result.public = !!publicClient;
  } catch {}

  try {
    const serviceClient = await getServiceClient();
    result.service = !!serviceClient;
  } catch {}

  return result;
};
