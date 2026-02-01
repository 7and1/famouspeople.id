import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_TOKEN;

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

// Default TTL: 5 minutes for API responses
const DEFAULT_TTL = 300;

/**
 * Get cached value from Redis
 * Returns null if cache miss or Redis not configured
 */
export const getCached = async <T>(key: string): Promise<T | null> => {
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    if (!value) return null;
    return value as T;
  } catch (err) {
    console.warn('[Cache] Get failed:', err);
    return null;
  }
};

/**
 * Set value in cache with optional TTL
 */
export const setCached = async <T>(
  key: string,
  value: T,
  ttlSeconds = DEFAULT_TTL
): Promise<void> => {
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.warn('[Cache] Set failed:', err);
  }
};

/**
 * Get or compute cached value
 * Uses stale-while-revalidate pattern for high-traffic endpoints
 */
export const getOrCompute = async <T>(
  key: string,
  compute: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL
): Promise<T> => {
  // Try cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Compute and cache
  const value = await compute();
  await setCached(key, value, ttlSeconds);
  return value;
};

export const purgeCache = async (keys: string[] = [], pattern?: string) => {
  if (!redis) {
    return { purged: 0, skipped: true };
  }

  let purged = 0;

  if (keys.length) {
    await redis.del(...keys);
    purged += keys.length;
  }

  if (pattern) {
    let cursor = 0;
    do {
      const [nextCursor, batch] = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = Number(nextCursor);
      if (batch.length) {
        await redis.del(...batch);
        purged += batch.length;
      }
    } while (cursor !== 0);
  }

  return { purged, skipped: false };
};
