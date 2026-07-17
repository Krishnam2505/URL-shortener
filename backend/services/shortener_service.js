import crypto from 'crypto';
import pool from '../db/pool.js';

// Base62 provides the maximum number of characters per digit using 
// only URL-safe, human-typeable characters (0-9, a-z, A-Z).
// This keeps short codes as short as possible. For example, the ID 10,000,000 
// becomes just "fxSK" in base62 (4 characters instead of 8 digits).
const BASE62_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Converts a base-10 integer into a Base62 string.
 */
function encodeBase62(num) {
  if (num === 0) return BASE62_CHARS[0];
  let encoded = "";
  while (num > 0) {
    const remainder = num % 62;
    encoded = BASE62_CHARS[remainder] + encoded;
    num = Math.floor(num / 62);
  }
  return encoded;
}

/**
 * Creates a new short link in the database.
 */
export async function createShortLink(originalUrl, customAlias = null) {
  if (customAlias) {
    // Attempt to insert with the custom alias directly
    try {
      const result = await pool.query(
        `INSERT INTO links (short_code, original_url, custom_alias) 
         VALUES ($1, $2, true) RETURNING *`,
        [customAlias, originalUrl]
      );
      return { 
        shortCode: result.rows[0].short_code, 
        originalUrl: result.rows[0].original_url, 
        createdAt: result.rows[0].created_at 
      };
    } catch (error) {
      // Postgres error code 23505 is unique_violation
      if (error.code === '23505') {
        throw new Error("Collision"); 
      }
      throw error;
    }
  }

  // Why the two-step insert-then-update dance?
  // We need the auto-incremented Postgres `id` BEFORE we can encode it into base62.
  // But the `id` doesn't exist until the row is inserted!
  // So, we insert a temporary placeholder first to get the `id`, encode it, and then update the row.
  
  // 1. Insert with a temporary placeholder code (must be <= 10 chars to fit VARCHAR(10))
  const tempCode = "t_" + crypto.randomUUID().slice(0, 8); 
  const insertResult = await pool.query(
    `INSERT INTO links (short_code, original_url) 
     VALUES ($1, $2) RETURNING id`,
    [tempCode, originalUrl]
  );
  
  const newId = insertResult.rows[0].id;
  
  // 2. Encode the newly generated ID to base62
  const shortCode = encodeBase62(parseInt(newId, 10));
  
  // 3. Update the row with the real base62 short_code
  const updateResult = await pool.query(
    `UPDATE links SET short_code = $1 WHERE id = $2 RETURNING *`,
    [shortCode, newId]
  );
  
  return { 
    shortCode: updateResult.rows[0].short_code, 
    originalUrl: updateResult.rows[0].original_url, 
    createdAt: updateResult.rows[0].created_at 
  };
}

/**
 * Retrieves the original URL for a given short code.
 */
export async function getOriginalUrl(shortCode) {
  const result = await pool.query(
    `SELECT original_url, click_count FROM links WHERE short_code = $1`,
    [shortCode]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}
