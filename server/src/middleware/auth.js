'use strict';

const { verifyToken } = require('../utils/token');
const { ApiError } = require('./errorHandler');

// Verifies the Bearer token. Missing/malformed/expired -> 401.
// On success, attaches req.user = { id, role, email }.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'missing_token', 'Authentication token required'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token';
    return next(new ApiError(401, code, 'Invalid or expired token'));
  }
}

// Requires the authenticated user to hold a specific role.
// Authenticated-but-wrong-role -> 403 (distinct from the 401 above).
function requireRole(role) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(new ApiError(401, 'missing_token', 'Authentication token required'));
    }
    if (req.user.role !== role) {
      return next(new ApiError(403, 'forbidden_role', `Requires ${role} role`));
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
