'use strict';

// Applies db/schema.sql to the configured database.
// Pass --reset to DROP all app tables/types first (destructive; dev convenience).

const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

const RESET_SQL = `
  DROP TABLE IF EXISTS fills CASCADE;
  DROP TABLE IF EXISTS prescription_medicines CASCADE;
  DROP TABLE IF EXISTS prescriptions CASCADE;
  DROP TABLE IF EXISTS medicines CASCADE;
  DROP TABLE IF EXISTS admins CASCADE;
  DROP TABLE IF EXISTS pharmacies CASCADE;
  DROP TABLE IF EXISTS doctors CASCADE;
  DROP TYPE IF EXISTS prescription_status;
`;

async function main() {
  const reset = process.argv.includes('--reset');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  try {
    if (reset) {
      console.log('Resetting: dropping existing tables/types...');
      await pool.query(RESET_SQL);
    }
    console.log('Applying schema.sql...');
    await pool.query(schema);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
