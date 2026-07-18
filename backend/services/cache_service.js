import Redis from 'ioredis';
import config from '../config.js';

// For now (before sharding is wired in), create ONE client connected to the first shard
const redis = new Redis(config.REDIS_SHARD_URLS[0]);

// Handle connection errors gracefully so they don't crash the Node.js process
redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

/**
 * Gets a parsed JSON value from the cache.
 * 
 * WHY WE SWALLOW ERRORS HERE:
 * Redis is a performance optimization in this architecture, not a source of truth. 
 * If Redis goes down or blips, the app should degrade gracefully and just fall back 
 * to reading from PostgreSQL (which will be slower, but will still work). 
 * Treating a cache outage as a fatal error would make the whole system LESS reliable 
 * than not having a cache at all.
 */
export async function getCached(key) {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error(`Cache Read Error for key ${key}:`, error.message);
    return null; // Degrade gracefully to a cache miss
  }
}

/**
 * Saves a JSON value to the cache with an expiration (TTL).
 */
export async function setCached(key, value, ttlSeconds = config.CACHE_TTL_SECONDS) {
  try {
    const stringified = JSON.stringify(value);
    // SETEX = SET with EXpiration
    await redis.setex(key, ttlSeconds, stringified);
  } catch (error) {
    console.error(`Cache Write Error for key ${key}:`, error.message);
    // We swallow the error here too, as a failed cache write shouldn't break the user's request.
  }
}

/**
 * Deletes a value from the cache.
 */
export async function deleteCached(key) {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Cache Delete Error for key ${key}:`, error.message);
  }
}
