'use strict';

const { query, withTransaction } = require('../db');
const { ApiError } = require('../middleware/errorHandler');

// Lists prescriptions still available to fill (status = 'pending'), with their
// medicine lines so the pharmacist can verify against physical stock.
async function listPendingPrescriptions() {
  const { rows: pending } = await query(
    `SELECT p.id, p.patient_name, p.patient_age, p.patient_gender, p.patient_contact, p.diagnosis,
            p.status, p.created_at,
            d.name AS doctor_name
       FROM prescriptions p
       JOIN doctors d ON d.id = p.doctor_id
      WHERE p.status = 'pending'
      ORDER BY p.created_at ASC, p.id ASC`
  );

  return attachMedicineLines(pending);
}

// Lists prescriptions this pharmacy has personally filled (newest first) — the
// "Filled History" view. Includes derived fulfillment time (filled_at - created_at).
async function listFilledByPharmacy(pharmacyId) {
  const { rows: filled } = await query(
    `SELECT p.id, p.patient_name, p.patient_age, p.patient_gender, p.patient_contact, p.diagnosis,
            p.status, p.created_at,
            d.name AS doctor_name,
            f.filled_at,
            EXTRACT(EPOCH FROM (f.filled_at - p.created_at)) AS fulfillment_seconds
       FROM fills f
       JOIN prescriptions p ON p.id = f.prescription_id
       JOIN doctors d       ON d.id = p.doctor_id
      WHERE f.pharmacy_id = $1
      ORDER BY f.filled_at DESC`,
    [pharmacyId]
  );

  return attachMedicineLines(filled);
}

// Summary stats for the pharmacy dashboard / filled-history header.
async function getPharmacyStats(pharmacyId) {
  const { rows: pendingRows } = await query(
    `SELECT COUNT(*) AS pending FROM prescriptions WHERE status = 'pending'`
  );
  const { rows: filledRows } = await query(
    `SELECT COUNT(*) AS total_filled,
            COUNT(*) FILTER (WHERE filled_at::date = CURRENT_DATE) AS filled_today,
            AVG(EXTRACT(EPOCH FROM (f.filled_at - p.created_at))) AS avg_fulfillment_seconds
       FROM fills f
       JOIN prescriptions p ON p.id = f.prescription_id
      WHERE f.pharmacy_id = $1`,
    [pharmacyId]
  );
  const f = filledRows[0];
  return {
    pending_count: Number(pendingRows[0].pending),
    filled_by_you_total: Number(f.total_filled),
    filled_today: Number(f.filled_today),
    avg_fulfillment_seconds: f.avg_fulfillment_seconds === null ? null : Math.round(Number(f.avg_fulfillment_seconds)),
  };
}

// Attaches medicine lines to a list of prescription-shaped rows in one extra query.
async function attachMedicineLines(rows) {
  if (rows.length === 0) return [];
  const ids = rows.map((p) => p.id);
  const { rows: lines } = await query(
    `SELECT pm.prescription_id, m.id, m.name, m.form, m.strength, pm.dosage, pm.frequency, pm.duration
       FROM prescription_medicines pm
       JOIN medicines m ON m.id = pm.medicine_id
      WHERE pm.prescription_id = ANY($1)
      ORDER BY m.name`,
    [ids]
  );

  const byRx = new Map(rows.map((p) => [p.id, { ...p, medicines: [] }]));
  for (const line of lines) {
    const { prescription_id, ...med } = line;
    byRx.get(prescription_id).medicines.push(med);
  }
  return [...byRx.values()];
}

// Atomically fill a pending prescription. This is the core concurrency-safe path.
//
// Within ONE transaction:
//   1. UPDATE ... SET status='filled' WHERE id=:id AND status='pending'
//      - the WHERE guard means only ONE of two concurrent requests can affect a row.
//   2. Only if exactly one row changed, INSERT the fills record.
//
// If the UPDATE affects zero rows, we distinguish "already filled" from
// "not found" by checking existence, then roll back (nothing is written).
// The UNIQUE constraint on fills.prescription_id is an independent DB-level
// backstop: even a logic bug could not create two fills for one prescription.
async function fillPrescription(prescriptionId, pharmacyId) {
  return withTransaction(async (client) => {
    const upd = await client.query(
      `UPDATE prescriptions SET status = 'filled'
        WHERE id = $1 AND status = 'pending'`,
      [prescriptionId]
    );

    if (upd.rowCount === 0) {
      // Guard did not match. Figure out why for a precise error.
      const { rows } = await client.query(
        'SELECT status FROM prescriptions WHERE id = $1',
        [prescriptionId]
      );
      if (rows.length === 0) {
        throw new ApiError(404, 'not_found', 'Prescription not found');
      }
      throw new ApiError(409, 'already_filled', 'This prescription has already been filled');
    }

    const { rows: fillRows } = await client.query(
      `INSERT INTO fills (prescription_id, pharmacy_id)
       VALUES ($1, $2)
       RETURNING id, prescription_id, pharmacy_id, filled_at`,
      [prescriptionId, pharmacyId]
    );

    return {
      prescription_id: prescriptionId,
      status: 'filled',
      fill: fillRows[0],
    };
  });
}

module.exports = { listPendingPrescriptions, listFilledByPharmacy, getPharmacyStats, fillPrescription };
