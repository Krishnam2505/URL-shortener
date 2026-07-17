import dotenv from 'dotenv';
dotenv.config();

// Fail fast: A URL shortener with no working database is useless. 
// It is much better to crash immediately on startup with a clear error message 
// than to start successfully and then fail confusingly on the very first user request.
if (!process.env.DATABASE_URL) {
  throw new Error("CRITICAL: DATABASE_URL environment variable is missing.");
}

const shardCount = parseInt(process.env.REDIS_SHARD_COUNT || '3', 10);
const redisShardUrls = [];

// Dynamically build the array of Redis shard URLs based on the shard count
for (let i = 0; i < shardCount; i++) {
  const shardUrl = process.env[`REDIS_SHARD_${i}_URL`];
  if (shardUrl) {
    redisShardUrls.push(shardUrl);
  } else {
    console.warn(`Warning: REDIS_SHARD_${i}_URL is missing from environment variables.`);
  }
}

const config = {
  PORT: parseInt(process.env.PORT || '8000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_SHARD_URLS: redisShardUrls,
  CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10),
  RATE_LIMIT_CAPACITY: parseInt(process.env.RATE_LIMIT_CAPACITY || '10', 10),
  RATE_LIMIT_REFILL_PER_SEC: parseInt(process.env.RATE_LIMIT_REFILL_PER_SEC || '1', 10),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173"
};

export default config;
