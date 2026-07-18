import { checkRateLimit } from '../services/rateLimiter_service.js';

/**
 * Express middleware that intercepts incoming requests and checks them against
 * the Token Bucket rate limiter in Redis.
 */
export async function rateLimitMiddleware(req, res, next) {
  // Identify the client. In a real production app behind a load balancer, 
  // you might need to use req.headers['x-forwarded-for'] instead of req.ip.
  const clientId = req.ip || 'unknown-client';
  
  const result = await checkRateLimit(clientId);
  
  if (result.allowed) {
    // Attach the remaining token count to the headers so the client knows their status
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    
    // Let the request continue to the actual route handler
    next();
  } else {
    // Request is blocked. Tell the client exactly how long to wait.
    res.setHeader('Retry-After', result.retryAfterSeconds);
    
    // 429 means "Too Many Requests"
    return res.status(429).json({
      error: "Too many requests. Please slow down.",
      retryAfterSeconds: result.retryAfterSeconds
    });
  }
}
