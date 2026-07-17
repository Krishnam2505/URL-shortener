import pg from 'pg';
import config from '../config.js';

const { Pool } = pg;

// Why use a singleton pool instead of creating a new Pool per request?
// Connection pooling reuses a fixed number of Database connections across all incoming requests.
// If we created a new pool or connection per request, we would exhaust Postgres's max connections 
// almost immediately under high load. By exporting a single shared pool here, 
// every route in our app shares the same limited set of efficient connections.
const pool = new Pool({
  connectionString: config.DATABASE_URL
});

// We attach an error handler to the pool to catch unexpected idle client errors
// instead of letting them crash our entire Node.js process.
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
