'use strict';

const path = require('path');
// Load server/.env regardless of the cwd the process was started from.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  databaseUrl: process.env.DATABASE_URL || 'postgres://rxuser:rxpass@localhost:5432/rxtracker',
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || 'Root Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@rxtracker.local',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin12345',
  },
};

module.exports = config;
