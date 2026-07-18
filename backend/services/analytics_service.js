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
