'use strict';

const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({ connectionString: config.databaseUrl });

// Simple query helper against the pool.
function query(text, params) {
  return pool.query(text, params);
}

// Run `fn` inside a single BEGIN..COMMIT transaction on one dedicated client.
// Rolls back on any thrown error, always releases the client.
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_rollbackErr) {
      /* ignore rollback failure; surface the original error */
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
