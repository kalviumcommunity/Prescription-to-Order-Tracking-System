'use strict';

const express = require('express');
const cors = require('cors');
const config = require('./config');
const { pool } = require('./db');
const { errorHandler, ApiError } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctor');
const pharmacyRoutes = require('./routes/pharmacy');
const adminRoutes = require('./routes/admin');

const app = express();

// Always allow the local Vite dev server; add any deployed frontend(s) via
// FRONTEND_URL (comma-separated for multiple origins, e.g. preview + prod).
const allowedOrigins = [
  'http://localhost:5820',
  ...config.frontendUrl.split(',').map((s) => s.trim()).filter(Boolean),
];

app.use(cors({
  origin(origin, callback) {
    // No Origin header = same-origin, curl, health checks, server-to-server — allow.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new ApiError(403, 'cors_rejected', `Origin "${origin}" is not allowed`));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Feature routers (all under /api).
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/admin', adminRoutes);

// Unknown API route -> 404 JSON.
app.use('/api', (req, res, next) => {
  next(new ApiError(404, 'not_found', `No route for ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

// Only listen when run directly (the concurrency test imports the app instead).
if (require.main === module) {
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`API listening on http://0.0.0.0:${config.port}`);
  });

  const shutdown = () => {
    server.close(() => pool.end().then(() => process.exit(0)));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = app;
