/**
 * EdgeCache - Cloudflare KV-based caching with ctx.waitUntil
 * Optimized for Workers edge runtime with non-blocking writes
 */

import type { Context } from 'hono';

// Default TTL: 5 minutes for API responses
const DEFAULT_TTL_SECONDS = 300;
// Stale-while-revalidate window: 1 minute
const SWR_TTL_SECONDS = 60;
// Maximum cache entry size (1MB - KV limit is 25MB but smaller is faster)
const MAX_CACHE_SIZE_BYTES = 1024 * 1024;

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  staleAt: number;
  etag?: string;
}

export interface CacheOptions {
  ttlSeconds?: number;
  swrSeconds?: number;
  tags?: string[];
  compress?: boolean;
}

/**
 * Get KV namespace from environment
 */
const getKV = (): KVNamespace | null => {
  return (globalThis as any).KV_CACHE || null;
};

/**
 * Generate cache key with prefix
 */
const generateKey = (key: string): string => {
  return `api:${key}`;
};

/**
 * Compress value using CompressionStream if available
 */
const compressValue = async (value: string): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);

  if (typeof CompressionStream === 'undefined') {
    return data;
  }

  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    chunks.push(chunk);
  }

  // Combine chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
};

/**
 * Decompress value using DecompressionStream
 */
const decompressValue = async (data: Uint8Array): Promise<string> => {
  if (typeof DecompressionStream === 'undefined') {
    return new TextDecoder().decode(data);
  }

  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    chunks.push(chunk);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(result);
};

/**
 * Get cached value from KV with stale-while-revalidate support
 */
export const getCached = async <T>(key: string): Promise<{ entry: CacheEntry<T> | null; isStale: boolean }> => {
  const kv = getKV();
  if (!kv) return { entry: null, isStale: false };

  try {
    const cacheKey = generateKey(key);
    const stored = await kv.get(cacheKey, 'arrayBuffer');

    if (!stored) {
      return { entry: null, isStale: false };
    }

    const data = new Uint8Array(stored as ArrayBuffer);
    const json = await decompressValue(data);
    const entry: CacheEntry<T> = JSON.parse(json);

    const now = Date.now();
    const isExpired = entry.expiresAt < now;
    const isStale = entry.staleAt < now;

    if (isExpired) {
      // Delete expired entry asynchronously
      kv.delete(cacheKey).catch(() => {});
      return { entry: null, isStale: false };
    }

    return { entry, isStale };
  } catch (err) {
    console.warn('[EdgeCache] Get failed:', err);
    return { entry: null, isStale: false };
  }
};

/**
 * Set value in KV cache with TTL using waitUntil for non-blocking writes
 */
export const setCached = async <T>(
  c: Context | null,
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> => {
  const kv = getKV();
  if (!kv) return;

  const { ttlSeconds = DEFAULT_TTL_SECONDS, swrSeconds = SWR_TTL_SECONDS } = options;

  try {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + (ttlSeconds + swrSeconds) * 1000,
      staleAt: now + ttlSeconds * 1000,
    };

    const json = JSON.stringify(entry);

    // Check size limit
    if (json.length > MAX_CACHE_SIZE_BYTES) {
      console.warn('[EdgeCache] Entry too large, skipping:', key);
      return;
    }

    const data = await compressValue(json);

    // Use waitUntil for non-blocking write if context available
    const putPromise = kv.put(generateKey(key), data.buffer as ArrayBuffer, {
      expirationTtl: ttlSeconds + swrSeconds,
    });

    if (c?.executionCtx) {
      c.executionCtx.waitUntil(putPromise);
    } else {
      await putPromise;
    }
  } catch (err) {
    console.warn('[EdgeCache] Set failed:', err);
  }
};

/**
 * Get or compute cached value with stale-while-revalidate pattern
 * Uses ctx.waitUntil for background revalidation
 */
export const getOrCompute = async <T>(
  c: Context,
  key: string,
  compute: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> => {
  const { entry, isStale } = await getCached<T>(key);

  if (entry && !isStale) {
    // Cache hit and fresh
    return entry.value;
  }

  if (entry && isStale) {
    // Stale cache - return stale value and revalidate in background
    const revalidatePromise = compute()
      .then((value) => setCached(c, key, value, options))
      .catch((err) => console.warn('[EdgeCache] Background revalidation failed:', err));

    c.executionCtx.waitUntil(revalidatePromise);
    return entry.value;
  }

  // Cache miss - compute and store
  const value = await compute();
  await setCached(c, key, value, options);
  return value;
};

/**
 * Purge cache entries by keys or pattern
 */
export const purgeCache = async (keys: string[] = [], pattern?: string): Promise<{ purged: number; skipped: boolean }> => {
  const kv = getKV();
  if (!kv) {
    return { purged: 0, skipped: true };
  }

  let purged = 0;

  if (keys.length) {
    const deletePromises = keys.map((key) =>
      kv.delete(generateKey(key)).catch(() => {})
    );
    await Promise.all(deletePromises);
    purged += keys.length;
  }

  if (pattern) {
    // KV doesn't support pattern deletion natively
    // List all keys and filter
    const list = await kv.list({ prefix: generateKey(pattern.replace('*', '')) });
    const deletePromises = list.keys.map((k: { name: string }) => kv.delete(k.name).catch(() => {}));
    await Promise.all(deletePromises);
    purged += list.keys.length;
  }

  return { purged, skipped: false };
};

/**
 * Generate ETag for cache validation
 */
export const generateETag = (data: unknown): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${hash.toString(16)}"`;
};

/**
 * Check if client cache is fresh using If-None-Match header
 */
export const isClientCacheFresh = (c: Context, etag: string): boolean => {
  const ifNoneMatch = c.req.header('If-None-Match');
  return ifNoneMatch === etag;
};

/**
 * EdgeCache class for instance-based caching
 */
export class EdgeCache {
  private defaultTTL: number;
  private defaultSWR: number;

  constructor(defaultTTL = DEFAULT_TTL_SECONDS, defaultSWR = SWR_TTL_SECONDS) {
    this.defaultTTL = defaultTTL;
    this.defaultSWR = defaultSWR;
  }

  async get<T>(key: string): Promise<{ entry: CacheEntry<T> | null; isStale: boolean }> {
    return getCached<T>(key);
  }

  async set<T>(c: Context, key: string, value: T, ttl?: number): Promise<void> {
    return setCached(c, key, value, {
      ttlSeconds: ttl || this.defaultTTL,
      swrSeconds: this.defaultSWR,
    });
  }

  async getOrCompute<T>(
    c: Context,
    key: string,
    compute: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return getOrCompute(c, key, compute, {
      ttlSeconds: ttl || this.defaultTTL,
      swrSeconds: this.defaultSWR,
    });
  }

  async purge(keys: string[], pattern?: string): Promise<{ purged: number; skipped: boolean }> {
    return purgeCache(keys, pattern);
  }
}

export default EdgeCache;
