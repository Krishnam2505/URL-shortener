import Redis from 'ioredis';
import config from '../config.js';
import hashRing from './hashRing_service.js';

// Create a dictionary of all our active Redis shards
const shardClients = {
  shard0: new Redis(config.REDIS_SHARD_URLS[0]),
  shard1: new Redis(config.REDIS_SHARD_URLS[1]),
  shard2: new Redis(config.REDIS_SHARD_URLS[2])
};

// Handle connection errors gracefully for all shards
Object.entries(shardClients).forEach(([shardName, client]) => {
  client.on('error', (err) => {
    console.error(`Redis connection error on ${shardName}:`, err.message);
  });
});

/**
 * CORE LOGIC: Find the right shard for a specific key
 * 
 * WHY MUST READS AND WRITES USE THE SAME SHARD?
 * If `setCached` randomly picked shard1 for "url:aB3x", but `getCached` randomly 
 * checked shard2, it would look like a Cache Miss every single time.
 * Consistent Hashing guarantees that for the exact same key, `getShardForKey` 
 * will ALWAYS mathematically return the exact same shard.
 */
function getClientForKey(key) {
  const shardName = hashRing.getShardForKey(key);
  return shardClients[shardName];
}

export async function getCached(key) {
  try {
    const redis = getClientForKey(key);
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error(`Cache Read Error for key ${key}:`, error.message);
    return null; // Degrade gracefully to a cache miss
  }
}

export async function setCached(key, value, ttlSeconds = config.CACHE_TTL_SECONDS) {
  try {
    const redis = getClientForKey(key);
    const stringified = JSON.stringify(value);
    await redis.setex(key, ttlSeconds, stringified);
  } catch (error) {
    console.error(`Cache Write Error for key ${key}:`, error.message);
  }
}

export async function deleteCached(key) {
  try {
    const redis = getClientForKey(key);
    await redis.del(key);
  } catch (error) {
    console.error(`Cache Delete Error for key ${key}:`, error.message);
  }
}
