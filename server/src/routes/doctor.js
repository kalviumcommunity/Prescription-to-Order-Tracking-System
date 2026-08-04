'use strict';

const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createPrescription, listDoctorPrescriptions, getDoctorStats } = require('../services/prescriptionService');
const { getFillRateByMedicine } = require('../services/analyticsService');
const { query } = require('../db');

const router = express.Router();

// Every doctor route requires a valid doctor token.
router.use(requireAuth, requireRole('doctor'));

// Read-only medicines catalog, so the doctor UI can populate its picker.
// (Catalog is pre-seeded; doctors cannot add entries — see PRD open issues.)
router.get('/medicines', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, form, strength FROM medicines ORDER BY name, strength'
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

// Create a prescription with embedded patient info + 1..N medicines.
router.post('/prescriptions', async (req, res, next) => {
  try {
    const rx = await createPrescription(req.user.id, req.body);
    return res.status(201).json(rx);
  } catch (err) {
    return next(err);
  }
});

// List the authenticated doctor's own prescriptions.
router.get('/prescriptions', async (req, res, next) => {
  try {
    const list = await listDoctorPrescriptions(req.user.id);
    return res.json(list);
  } catch (err) {
    return next(err);
  }
});

// Fill-rate per medicine, scoped to this doctor only.
router.get('/analytics/fill-rate', async (req, res, next) => {
  try {
    const analytics = await getFillRateByMedicine(req.user.id);
    return res.json(analytics);
  } catch (err) {
    return next(err);
  }
});

// Summary stats for the dashboard header (total / filled / pending / overall fill rate).
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getDoctorStats(req.user.id);
    return res.json(stats);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
