'use strict';

const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { hashPassword } = require('../utils/password');
const { ApiError } = require('../middleware/errorHandler');
const { requireString, requireEmail, requirePassword } = require('../utils/validate');

const router = express.Router();

// All admin routes require a valid admin token (no implicit trust).
router.use(requireAuth, requireRole('admin'));

// Create another admin. Not public — only an existing admin can do this.
// The first admin is seeded via db/seed.js, never through this endpoint.
router.post('/register', async (req, res, next) => {
  try {
    const name = requireString(req.body.name, 'name');
    const email = requireEmail(req.body.email);
    const password = requirePassword(req.body.password);

    const { rows: existing } = await query('SELECT id FROM admins WHERE email = $1', [email]);
    if (existing.length > 0) {
      throw new ApiError(409, 'email_taken', 'An admin with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const { rows } = await query(
      'INSERT INTO admins (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

// Read-only oversight: all doctors.
router.get('/doctors', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, email, license_no, specialization, phone, created_at
         FROM doctors ORDER BY created_at DESC, id DESC`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

// Read-only oversight: all pharmacies.
router.get('/pharmacies', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, email, license_no, pharmacy_type, phone, created_at
         FROM pharmacies ORDER BY created_at DESC, id DESC`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

// Read-only oversight: all prescriptions system-wide with fill status.
router.get('/prescriptions', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.id, p.patient_name, p.patient_age, p.patient_gender, p.patient_contact, p.diagnosis,
              p.status, p.created_at,
              d.name  AS doctor_name,
              ph.name AS filled_by_pharmacy,
              f.filled_at
         FROM prescriptions p
         JOIN doctors d       ON d.id = p.doctor_id
         LEFT JOIN fills f     ON f.prescription_id = p.id
         LEFT JOIN pharmacies ph ON ph.id = f.pharmacy_id
        ORDER BY p.created_at DESC, p.id DESC`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
