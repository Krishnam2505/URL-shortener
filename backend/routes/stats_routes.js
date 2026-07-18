import express from 'express';
import { getStats } from '../services/analytics_service.js';

const router = express.Router();

// GET /api/stats/:shortCode
// Returns the analytics data for a given short link.
router.get('/stats/:shortCode', async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    
    const stats = await getStats(shortCode);
    
    if (!stats) {
      return res.status(404).json({ error: "No stats found for this short code" });
    }
    
    res.status(200).json({
      shortCode: stats.short_code,
      originalUrl: stats.original_url,
      clickCount: stats.click_count,
      createdAt: stats.created_at
    });
    
  } catch (error) {
    next(error);
  }
});

export default router;
