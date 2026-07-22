'use strict';

const express = require('express');
const { query } = require('../db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/token');
const { ApiError } = require('../middleware/errorHandler');
const { requireString, requireEmail, requirePassword } = require('../utils/validate');

const router = express.Router();

// Maps a role to its table. Admins are never self-registerable via this router.
const ROLE_TABLE = { doctor: 'doctors', pharmacy: 'pharmacies', admin: 'admins' };

// Shared registration handler for public roles (doctor, pharmacy).
function makeRegisterHandler(role) {
  const table = ROLE_TABLE[role];
  return async function register(req, res, next) {
    try {
      const name = requireString(req.body.name, 'name');
      const email = requireEmail(req.body.email);
      const password = requirePassword(req.body.password);
      const licenseNo = req.body.license_no ? String(req.body.license_no).trim() : null;
      const phone = req.body.phone ? String(req.body.phone).trim() : null;
      const specialization = role === 'doctor' && req.body.specialization
        ? String(req.body.specialization).trim() : null;
      const pharmacyType = role === 'pharmacy' && req.body.pharmacy_type
        ? String(req.body.pharmacy_type).trim() : null;

      const { rows: existing } = await query(`SELECT id FROM ${table} WHERE email = $1`, [email]);
      if (existing.length > 0) {
        throw new ApiError(409, 'email_taken', `A ${role} with this email already exists`);
      }

      const passwordHash = await hashPassword(password);
      let inserted;
      if (role === 'pharmacy') {
        ({ rows: inserted } = await query(
          `INSERT INTO pharmacies (name, email, password_hash, license_no, pharmacy_type, phone)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email`,
          [name, email, passwordHash, licenseNo, pharmacyType, phone]
        ));
      } else {
        ({ rows: inserted } = await query(
          `INSERT INTO doctors (name, email, password_hash, license_no, specialization, phone)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email`,
          [name, email, passwordHash, licenseNo, specialization, phone]
        ));
      }

      const user = inserted[0];
      const token = signToken({ id: user.id, role, email: user.email });
      return res.status(201).json({ token, role, user });
    } catch (err) {
      return next(err);
    }
  };
}

router.post('/register/doctor', makeRegisterHandler('doctor'));
router.post('/register/pharmacy', makeRegisterHandler('pharmacy'));

// Login for any role. Body: { email, password, role }. Role selects the table.
router.post('/login', async (req, res, next) => {
  try {
    const email = requireEmail(req.body.email);
    const password = requireString(req.body.password, 'password');
    const role = requireString(req.body.role, 'role');

    const table = ROLE_TABLE[role];
    if (!table) {
      throw new ApiError(400, 'validation_error', 'role must be doctor, pharmacy, or admin');
    }

    const { rows } = await query(
      `SELECT id, name, email, password_hash FROM ${table} WHERE email = $1`,
      [email]
    );
    const account = rows[0];

    // Same generic message whether the email is unknown or the password wrong.
    const ok = account && (await verifyPassword(password, account.password_hash));
    if (!ok) {
      throw new ApiError(401, 'invalid_credentials', 'Invalid email or password');
    }

    const token = signToken({ id: account.id, role, email: account.email });
    return res.json({
      token,
      role,
      user: { id: account.id, name: account.name, email: account.email },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
