'use strict';

const { query, withTransaction } = require('../db');
const { ApiError } = require('../middleware/errorHandler');
const { requireString, requireInt } = require('../utils/validate');

// Creates a prescription with 1+ medicines from the catalog. Status is forced to
// 'pending' — a prescription can never be created in any other state.
const MAX_MEDICINES_PER_PRESCRIPTION = 3;

async function createPrescription(doctorId, body) {
  const patientName = requireString(body.patient_name, 'patient_name');
  const patientAge = requireInt(body.patient_age, 'patient_age');
  const patientContact = requireString(body.patient_contact, 'patient_contact');
  const patientGender = typeof body.patient_gender === 'string' ? body.patient_gender.trim() || null : null;
  const diagnosis = typeof body.diagnosis === 'string' ? body.diagnosis.trim() || null : null;

  const items = Array.isArray(body.medicines) ? body.medicines : [];
  if (items.length === 0) {
    throw new ApiError(400, 'no_medicines', 'A prescription must contain at least one medicine');
  }
  if (items.length > MAX_MEDICINES_PER_PRESCRIPTION) {
    throw new ApiError(
      400,
      'too_many_medicines',
      `A prescription can contain at most ${MAX_MEDICINES_PER_PRESCRIPTION} medicines`
    );
  }

  // Normalize + validate each line references a real catalog medicine.
  const normalized = items.map((it) => ({
    medicineId: requireInt(it.medicine_id, 'medicine_id'),
    dosage: typeof it.dosage === 'string' ? it.dosage.trim() || null : null,
    frequency: typeof it.frequency === 'string' ? it.frequency.trim() || null : null,
    duration: typeof it.duration === 'string' ? it.duration.trim() || null : null,
  }));

  const uniqueIds = [...new Set(normalized.map((n) => n.medicineId))];
  const { rows: found } = await query('SELECT id FROM medicines WHERE id = ANY($1)', [uniqueIds]);
  if (found.length !== uniqueIds.length) {
    throw new ApiError(400, 'unknown_medicine', 'One or more medicines are not in the catalog');
  }

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO prescriptions (doctor_id, patient_name, patient_age, patient_gender, patient_contact, diagnosis)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, patient_name, patient_age, patient_gender, patient_contact, diagnosis, status, created_at`,
      [doctorId, patientName, patientAge, patientGender, patientContact, diagnosis]
    );
    const rx = rows[0];

    for (const line of normalized) {
      await client.query(
        `INSERT INTO prescription_medicines (prescription_id, medicine_id, dosage, frequency, duration)
         VALUES ($1, $2, $3, $4, $5)`,
        [rx.id, line.medicineId, line.dosage, line.frequency, line.duration]
      );
    }

    return getPrescriptionById(rx.id, client);
  });
}

// Returns one prescription with its medicine lines. Accepts an optional client
// so it can run inside an open transaction.
async function getPrescriptionById(id, client) {
  const runner = client || { query };
  const { rows } = await runner.query(
    `SELECT p.id, p.patient_name, p.patient_age, p.patient_gender, p.patient_contact, p.diagnosis,
            p.status, p.created_at,
            f.filled_at, ph.name AS filled_by_pharmacy
       FROM prescriptions p
       LEFT JOIN fills f      ON f.prescription_id = p.id
       LEFT JOIN pharmacies ph ON ph.id = f.pharmacy_id
      WHERE p.id = $1`,
    [id]
  );
  if (rows.length === 0) return null;
  const rx = rows[0];
  rx.medicines = await getMedicinesForPrescription(id, runner);
  return rx;
}

async function getMedicinesForPrescription(prescriptionId, runner) {
  const { rows } = await runner.query(
    `SELECT m.id, m.name, m.form, m.strength, pm.dosage, pm.frequency, pm.duration
       FROM prescription_medicines pm
       JOIN medicines m ON m.id = pm.medicine_id
      WHERE pm.prescription_id = $1
      ORDER BY m.name`,
    [prescriptionId]
  );
  return rows;
}

// Lists a doctor's own prescriptions (newest first) with medicine lines.
async function listDoctorPrescriptions(doctorId) {
  const { rows: prescriptions } = await query(
    `SELECT p.id, p.patient_name, p.patient_age, p.patient_gender, p.patient_contact, p.diagnosis,
            p.status, p.created_at,
            f.filled_at, ph.name AS filled_by_pharmacy
       FROM prescriptions p
       LEFT JOIN fills f      ON f.prescription_id = p.id
       LEFT JOIN pharmacies ph ON ph.id = f.pharmacy_id
      WHERE p.doctor_id = $1
      ORDER BY p.created_at DESC, p.id DESC`,
    [doctorId]
  );

  if (prescriptions.length === 0) return [];

  // Fetch all medicine lines for these prescriptions in one query, then group.
  const ids = prescriptions.map((p) => p.id);
  const { rows: lines } = await query(
    `SELECT pm.prescription_id, m.id, m.name, m.form, m.strength, pm.dosage, pm.frequency, pm.duration
       FROM prescription_medicines pm
       JOIN medicines m ON m.id = pm.medicine_id
      WHERE pm.prescription_id = ANY($1)
      ORDER BY m.name`,
    [ids]
  );

  const byRx = new Map(prescriptions.map((p) => [p.id, { ...p, medicines: [] }]));
  for (const line of lines) {
    const { prescription_id, ...med } = line;
    byRx.get(prescription_id).medicines.push(med);
  }
  return [...byRx.values()];
}

// Summary stats for the doctor dashboard (total / filled / pending / overall fill rate).
async function getDoctorStats(doctorId) {
  const { rows } = await query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'filled') AS filled
       FROM prescriptions
      WHERE doctor_id = $1`,
    [doctorId]
  );
  const total = Number(rows[0].total);
  const filled = Number(rows[0].filled);
  return {
    total_prescriptions: total,
    filled_prescriptions: filled,
    pending_prescriptions: total - filled,
    overall_fill_rate_pct: total === 0 ? null : Math.round((filled / total) * 100),
  };
}

module.exports = {
  createPrescription,
  listDoctorPrescriptions,
  getPrescriptionById,
  getDoctorStats,
  MAX_MEDICINES_PER_PRESCRIPTION,
};
