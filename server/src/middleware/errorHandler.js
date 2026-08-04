'use strict';

// A small typed error the routes/services throw to control HTTP status + code.
class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Central Express error handler. Always responds with { error, code }.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }

  // Postgres unique-violation backstop (e.g. the fills.prescription_id UNIQUE
  // constraint firing under a race the app logic somehow missed).
  if (err && err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists', code: 'unique_violation' });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error', code: 'internal_error' });
}

module.exports = { ApiError, errorHandler };
