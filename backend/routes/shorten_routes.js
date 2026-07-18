import express from 'express';
import { createShortLink } from '../services/shortener_service.js';
import config from '../config.js';
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// POST /api/shorten
// We ONLY apply the rate limiter here on link creation (the "Write Path").
// We do NOT apply it to the redirect route (the "Read Path") because we WANT 
// redirects to be as fast and unrestricted as possible for legitimate users. 
// Link creation is the expensive, abuse-prone path that needs throttling.
router.post('/shorten', rateLimitMiddleware, async (req, res, next) => {
  try {
    const { originalUrl, customAlias } = req.body;

    // Validation: Ensure the user actually provided a URL
    if (!originalUrl) {
      return res.status(400).json({ error: "originalUrl is required" });
    }

    // 1. Validate originalUrl shape
    // We validate the shape here because failing fast with a clear message is better
    // than silently creating a broken short link that goes nowhere.
    try {
      new URL(originalUrl);
    } catch (err) {
      return res.status(400).json({ error: "Please provide a valid URL, including http:// or https://" });
    }

    // 2. Validate customAlias shape (if provided)
    if (customAlias) {
      const aliasRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!aliasRegex.test(customAlias)) {
        return res.status(400).json({ error: "Custom alias must be 3-20 characters, letters/numbers/hyphens/underscores only" });
      }
    }

    // Call our core business logic
    const result = await createShortLink(originalUrl, customAlias);
    
    // Dynamically build the short URL based on the request host
    // If it's localhost, we use http. If it's a real domain (like Render), we use https.
    const host = req.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Return a 201 Created status, along with the data
    res.status(201).json({
      shortCode: result.shortCode,
      shortUrl: `${baseUrl}/${result.shortCode}`,
      originalUrl: result.originalUrl
    });

  } catch (error) {
    // If our service threw the specific Collision error, return a 409 Conflict
    if (error.message === "Collision") {
      return res.status(409).json({ error: "That custom alias is already taken" });
    }
    
    // For any other unexpected error, pass it to the global error handler
    next(error);
  }
});

export default router;
