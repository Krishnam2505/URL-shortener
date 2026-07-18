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
router.post('/shorten', rateLimitMiddleware, async (req, res) => {
  try {
    const { originalUrl, customAlias } = req.body;

    // Validation: Ensure the user actually provided a URL
    if (!originalUrl) {
      return res.status(400).json({ error: "originalUrl is required" });
    }

    // Call our core business logic
    const result = await createShortLink(originalUrl, customAlias);
    
    // Return a 201 Created status, along with the data
    res.status(201).json({
      shortCode: result.shortCode,
      shortUrl: `http://localhost:${config.PORT}/${result.shortCode}`,
      originalUrl: result.originalUrl
    });

  } catch (error) {
    // If our service threw the specific Collision error, return a 409 Conflict
    if (error.message === "Collision") {
      return res.status(409).json({ error: "That custom alias is already taken" });
    }
    
    // For any other unexpected database error, log it and return a 500
    console.error("Error creating short link:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
