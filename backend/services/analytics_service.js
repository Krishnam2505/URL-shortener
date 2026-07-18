import pool from '../db/pool.js';

/**
 * Retrieves the analytics statistics for a specific short code.
 */
export async function getStats(shortCode) {
  const result = await pool.query(
    `SELECT short_code, original_url, click_count, created_at 
     FROM links 
     WHERE short_code = $1`,
    [shortCode]
  );
  
  if (result.rows.length === 0) {
    return null; // Link not found
  }
  
  return result.rows[0];
}

/**
 * Increments the click count for a given short code.
 * This is designed to be called asynchronously in the background.
 */
export async function incrementClickCount(shortCode) {
  try {
    await pool.query(
      `UPDATE links SET click_count = click_count + 1 WHERE short_code = $1`,
      [shortCode]
    );
  } catch (error) {
    console.error(`Failed to increment click count for ${shortCode}:`, error);
  }
}
