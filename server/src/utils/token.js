'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

// Token carries the account id (sub), role, and email. The role claim is what
// lets middleware reject a valid token used against another role's endpoints.
function signToken({ id, role, email }) {
  return jwt.sign({ sub: id, role, email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

// Throws (TokenExpiredError / JsonWebTokenError) on invalid tokens.
function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { signToken, verifyToken };
