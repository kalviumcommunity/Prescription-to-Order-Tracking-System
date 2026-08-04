'use strict';

const { ApiError } = require('../middleware/errorHandler');

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(400, 'validation_error', `${field} is required`);
  }
  return value.trim();
}

function requireEmail(value) {
  const email = requireString(value, 'email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'validation_error', 'A valid email is required');
  }
  return email;
}

function requirePassword(value) {
  if (typeof value !== 'string' || value.length < 6) {
    throw new ApiError(400, 'validation_error', 'Password must be at least 6 characters');
  }
  return value;
}

function requireInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ApiError(400, 'validation_error', `${field} must be a positive integer`);
  }
  return n;
}

module.exports = { requireString, requireEmail, requirePassword, requireInt };
