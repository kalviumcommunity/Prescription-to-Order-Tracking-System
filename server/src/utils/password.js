'use strict';

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

// Never log or return the plaintext.
function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword };
