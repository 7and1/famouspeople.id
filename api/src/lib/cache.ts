import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_TOKEN;

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

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
