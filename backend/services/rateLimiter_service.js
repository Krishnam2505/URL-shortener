import Redis from 'ioredis';
import config from '../config.js';

// Connect to the first Redis shard for our rate limiter state.
// (In a more advanced setup with sharding, we could consistent-hash rate limits too).
const redis = new Redis(config.REDIS_SHARD_URLS[0]);

// Handle connection errors gracefully
redis.on('error', (err) => {
  console.error('Redis Rate Limiter connection error:', err.message);
});

/**
 * LUA SCRIPT FOR ATOMIC TOKEN BUCKET
 * 
 * WHY MUST THIS BE ATOMIC?
 * Imagine two requests from the same user hit the server at the exact same millisecond.
 * If we used separate GET and SET commands, Request A would read "1 token left".
 * Request B would also read "1 token left" before Request A had a chance to subtract it.
 * Both requests would be allowed through, and they would both write back "0 tokens".
 * This is a classic "check-then-act" race condition.
 * 
 * By writing this logic in Lua and executing it via `redis.eval`, Redis guarantees
 * that the entire script runs as a single, uninterrupted operation. Request B will be 
 * forced to wait until Request A's script completely finishes.
 */
const TOKEN_BUCKET_SCRIPT = `
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local refillRate = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  
  -- 1. Read current bucket state
  local bucket = redis.call("hgetall", key)
  local currentTokens = capacity
  local lastRefill = now
  
  if #bucket > 0 then
    for i=1, #bucket, 2 do
      if bucket[i] == "tokens" then
        currentTokens = tonumber(bucket[i+1])
      elseif bucket[i] == "lastRefill" then
        lastRefill = tonumber(bucket[i+1])
      end
    end
  end
  
  -- 2. Calculate elapsed time and add new tokens
  local elapsed = math.max(0, now - lastRefill)
  local refill = elapsed * refillRate
  currentTokens = math.min(capacity, currentTokens + refill)
  
  -- 3. Determine if request is allowed
  local allowed = 0
  local retryAfter = 0
  
  if currentTokens >= 1 then
    allowed = 1
    currentTokens = currentTokens - 1
  else
    local missing = 1 - currentTokens
    retryAfter = math.ceil(missing / refillRate)
  end
  
  -- 4. Save refreshed state
  redis.call("hset", key, "tokens", currentTokens, "lastRefill", now)
  
  -- Auto-cleanup: Expire the key if the bucket sits full and untouched
  local expireTime = math.ceil(capacity / refillRate)
  redis.call("expire", key, expireTime)
  
  return { allowed, currentTokens, retryAfter }
`;

export async function checkRateLimit(clientId) {
  const key = `ratelimit:${clientId}`;
  // We use current time in seconds, with millisecond precision
  const now = Date.now() / 1000.0;
  
  try {
    const result = await redis.eval(
      TOKEN_BUCKET_SCRIPT, 
      1, // Number of KEYS provided
      key, 
      config.RATE_LIMIT_CAPACITY, 
      config.RATE_LIMIT_REFILL_PER_SEC, 
      now
    );
    
    // result is an array returned from Lua: [allowed (1 or 0), remainingTokens, retryAfterSeconds]
    const allowed = result[0] === 1;
    // Round down the remaining tokens so we return a clean integer (e.g. 5 instead of 5.342)
    const remaining = Math.floor(result[1]);
    const retryAfterSeconds = result[2];
    
    return {
      allowed,
      remaining,
      retryAfterSeconds
    };
  } catch (error) {
    console.error("Rate Limiter Error:", error.message);
    // If Redis fails, fail open (allow the request) rather than breaking the app.
    return {
      allowed: true,
      remaining: 1,
      retryAfterSeconds: 0
    };
  }
}
