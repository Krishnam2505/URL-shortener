import express from 'express';
import { getOriginalUrl } from '../services/shortener_service.js';
import { getCached, setCached } from '../services/cache_service.js';
import { incrementClickCount } from '../services/analytics_service.js';

const router = express.Router();

// GET /:shortCode — The hottest path in the system
// This must be registered LAST in server.js because it acts as a catch-all route.
router.get('/:shortCode', async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const cacheKey = `url:${shortCode}`;

    // 1. Check Redis Cache first
    let originalUrl = await getCached(cacheKey);

    if (originalUrl) {
      console.log(`[CACHE HIT] ${shortCode} -> ${originalUrl}`);
      // Skip the DB read entirely!
    } else {
      console.log(`[CACHE MISS] ${shortCode}`);
      // 2. Cache Miss: Fall back to PostgreSQL
      const linkData = await getOriginalUrl(shortCode);

      if (!linkData) {
        return res.status(404).send(`
          <h1>404 - Link Not Found</h1>
          <p>The short link you clicked does not exist or has been deleted.</p>
        `);
      }

      originalUrl = linkData.original_url;

      // 3. Populate Cache for the next person
      // WHY CACHE ONLY THE URL AND NOT CLICK COUNT?
      // click_count changes on every single request. If we cached it, it would 
      // instantly go stale, or we'd have to constantly invalidate/update the cache,
      // destroying our performance gains. We only cache data that is completely stable.
      await setCached(cacheKey, originalUrl);
    }

    // 302 means "Found / Temporary Redirect"
    // We increment the click count asynchronously so it doesn't slow down the redirect
    incrementClickCount(shortCode);
    res.redirect(302, originalUrl);

  } catch (error) {
    next(error);
  }
});

export default router;
