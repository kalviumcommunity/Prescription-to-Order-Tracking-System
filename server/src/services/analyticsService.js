'use strict';

const { query } = require('../db');

// Fill-rate per medicine, scoped to ONE doctor's prescriptions.
//
//   fill_rate = (# of that doctor's prescriptions containing the medicine that are filled)
//               / (# of that doctor's prescriptions containing the medicine)
//
// Medicines that appear on zero of this doctor's prescriptions are NOT returned
// (they'd be misleading as 0%). Recomputed on every request — no caching.
async function getFillRateByMedicine(doctorId) {
  const { rows } = await query(
    `SELECT m.id                                   AS medicine_id,
            m.name, m.form, m.strength,
            COUNT(DISTINCT p.id)                    AS total_prescriptions,
            COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'filled') AS filled_prescriptions
       FROM prescription_medicines pm
       JOIN prescriptions p ON p.id = pm.prescription_id
       JOIN medicines m     ON m.id = pm.medicine_id
      WHERE p.doctor_id = $1
      GROUP BY m.id, m.name, m.form, m.strength
      ORDER BY m.name`,
    [doctorId]
  );

  return rows.map((r) => {
    const total = Number(r.total_prescriptions);
    const filled = Number(r.filled_prescriptions);
    return {
      medicine_id: r.medicine_id,
      name: r.name,
      form: r.form,
      strength: r.strength,
      total_prescriptions: total,
      filled_prescriptions: filled,
      // Ratio 0..1 and a rounded percentage for display convenience.
      fill_rate: total === 0 ? null : filled / total,
      fill_rate_pct: total === 0 ? null : Math.round((filled / total) * 100),
    };
  });
}

module.exports = { getFillRateByMedicine };
