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

app.use(cors());
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
  const server = app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });

  const shutdown = () => {
    server.close(() => pool.end().then(() => process.exit(0)));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = app;
