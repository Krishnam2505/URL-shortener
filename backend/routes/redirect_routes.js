import express from 'express';
import { getOriginalUrl } from '../services/shortener_service.js';

const router = express.Router();

// The :shortCode syntax means this route will match ANY string 
// placed after the slash (e.g., /aB3x, /krishnam-resume, /xyz).
// Express will take that string and put it in req.params.shortCode
router.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Look up the original URL in the database
    const linkData = await getOriginalUrl(shortCode);

    if (!linkData) {
      // 404 means "Not Found". We send back a simple HTML page.
      return res.status(404).send(`
        <h1>404 - Link Not Found</h1>
        <p>The short link you requested does not exist.</p>
      `);
    }

    // 302 means "Found / Temporary Redirect"
    // This tells the user's web browser to instantly navigate to the original URL!
    res.redirect(302, linkData.original_url);

  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).send(`
      <h1>500 - Server Error</h1>
      <p>Something went wrong on our end.</p>
    `);
  }
});

export default router;
