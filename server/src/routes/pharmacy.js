'use strict';

const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listPendingPrescriptions,
  listFilledByPharmacy,
  getPharmacyStats,
  fillPrescription,
} = require('../services/fillService');
const { ApiError } = require('../middleware/errorHandler');
const { requireInt } = require('../utils/validate');

const router = express.Router();

router.use(requireAuth, requireRole('pharmacy'));

// List prescriptions available to fill. Supports ?status=pending (the only
// eligible status). Any other status value is rejected.
router.get('/prescriptions', async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';
    if (status !== 'pending') {
      throw new ApiError(400, 'validation_error', "Only status=pending is supported");
    }
    const list = await listPendingPrescriptions();
    return res.json(list);
  } catch (err) {
    return next(err);
  }
});

// Atomically mark a pending prescription as filled. Rejects if already filled.
router.patch('/prescriptions/:id/fill', async (req, res, next) => {
  try {
    const prescriptionId = requireInt(req.params.id, 'prescription id');
    const result = await fillPrescription(prescriptionId, req.user.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

// This pharmacy's own filled history (newest first).
router.get('/filled-history', async (req, res, next) => {
  try {
    const list = await listFilledByPharmacy(req.user.id);
    return res.json(list);
  } catch (err) {
    return next(err);
  }
});

// Summary stats for the pharmacy dashboard (pending count, filled by you, filled today).
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getPharmacyStats(req.user.id);
    return res.json(stats);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
