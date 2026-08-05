'use strict';

const path = require('path');
// Load server/.env regardless of the cwd the process was started from.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Insecure convenience defaults for local dev only — never used once
// NODE_ENV=production, so a misconfigured deploy fails loudly at boot
// instead of silently running with a known secret/credential.
const DEV_FALLBACK = {
  DATABASE_URL: 'postgres://rxuser:rxpass@localhost:5942/rxtracker',
  JWT_SECRET: 'dev-insecure-secret-change-me',
};

function requiredInProd(name) {
  const value = process.env[name];
  if (value) return value;
  if (isProduction) {
    throw new Error(`Missing required environment variable ${name} (refusing to start with NODE_ENV=production and no value set)`);
  }
  return DEV_FALLBACK[name];
}

const config = {
  nodeEnv,
  isProduction,
  databaseUrl: requiredInProd('DATABASE_URL'),
  port: parseInt(process.env.PORT || '4879', 10),
  jwtSecret: requiredInProd('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  // Comma-separated list of allowed frontend origins for CORS, e.g.
  // "https://your-app.vercel.app,https://staging.your-app.vercel.app".
  frontendUrl: process.env.FRONTEND_URL || '',
  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || 'Root Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@rxtracker.local',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin12345',
  },
};

module.exports = config;
