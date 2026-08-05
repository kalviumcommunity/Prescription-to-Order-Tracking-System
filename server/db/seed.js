'use strict';

// Seeds a reproducible dataset:
//   - 1 admin (from .env)
//   - a medicines catalog
//   - 2 doctors, 2 pharmacies
//   - sample prescriptions for doctor #1, some pre-filled
//
// Fill rates for doctor #1 are hand-verifiable (see SEED SUMMARY printed at the end).
// Re-running is safe: it wipes app data first, then re-inserts.

const { pool, withTransaction } = require('../src/db');
const { hashPassword } = require('../src/utils/password');
const config = require('../src/config');

const MEDICINES = [
  { name: 'Paracetamol', form: 'Tablet', strength: '500mg' },
  { name: 'Amoxicillin', form: 'Capsule', strength: '250mg' },
  { name: 'Ibuprofen', form: 'Tablet', strength: '400mg' },
  { name: 'Azithromycin', form: 'Tablet', strength: '500mg' },
  { name: 'Cetirizine', form: 'Tablet', strength: '10mg' },
  { name: 'Metformin', form: 'Tablet', strength: '500mg' },
  { name: 'Omeprazole', form: 'Capsule', strength: '20mg' },
  { name: 'Amlodipine', form: 'Tablet', strength: '5mg' },
];

async function clearData(client) {
  await client.query('TRUNCATE fills, prescription_medicines, prescriptions RESTART IDENTITY CASCADE');
  await client.query('TRUNCATE medicines RESTART IDENTITY CASCADE');
  await client.query('TRUNCATE admins, doctors, pharmacies RESTART IDENTITY CASCADE');
}

async function main() {
  if (config.isProduction && (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD)) {
    console.error(
      'Refusing to seed: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set explicitly ' +
      'when NODE_ENV=production (no falling back to the dev default admin account).'
    );
    process.exitCode = 1;
    return;
  }

  try {
    const adminHash = await hashPassword(config.seedAdmin.password);
    const doctorHash = await hashPassword('doctor12345');
    const pharmacyHash = await hashPassword('pharma12345');

    await withTransaction(async (client) => {
      await clearData(client);

      // Admin
      await client.query(
        'INSERT INTO admins (name, email, password_hash) VALUES ($1, $2, $3)',
        [config.seedAdmin.name, config.seedAdmin.email, adminHash]
      );

      // Doctors
      const { rows: docs } = await client.query(
        `INSERT INTO doctors (name, email, password_hash, license_no, specialization, phone) VALUES
           ('Dr. Meera Nair', 'meera@rxtracker.local', $1, 'MCI-55231', 'General Physician', '+91 98765 43210'),
           ('Dr. Arjun Rao',  'arjun@rxtracker.local', $1, 'MCI-55897', 'Cardiologist',       '+91 98765 43211')
         RETURNING id`,
        [doctorHash]
      );
      const doctor1 = docs[0].id;

      // Pharmacies
      const { rows: phs } = await client.query(
        `INSERT INTO pharmacies (name, email, password_hash, license_no, pharmacy_type, phone) VALUES
           ('MedPlus Central', 'medplus@rxtracker.local', $1, 'PCI-PH-1001', 'Retail', '+91 98765 12001'),
           ('Apollo Pharmacy', 'apollo@rxtracker.local',  $1, 'PCI-PH-1002', 'Retail', '+91 98765 12002')
         RETURNING id`,
        [pharmacyHash]
      );
      const pharmacy1 = phs[0].id;

      // Medicines catalog
      const medIds = {};
      for (const m of MEDICINES) {
        const { rows } = await client.query(
          'INSERT INTO medicines (name, form, strength) VALUES ($1, $2, $3) RETURNING id',
          [m.name, m.form, m.strength]
        );
        medIds[m.name] = rows[0].id;
      }

      // Helper: create a prescription with medicines, optionally filled.
      async function createRx(doctorId, patient, meds, filled) {
        const { rows } = await client.query(
          `INSERT INTO prescriptions (doctor_id, patient_name, patient_age, patient_gender, patient_contact, diagnosis, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [doctorId, patient.name, patient.age, patient.gender, patient.contact, patient.diagnosis, filled ? 'filled' : 'pending']
        );
        const rxId = rows[0].id;
        for (const medName of meds) {
          await client.query(
            `INSERT INTO prescription_medicines (prescription_id, medicine_id, dosage, frequency, duration)
             VALUES ($1, $2, $3, $4, $5)`,
            [rxId, medIds[medName], '1 tablet', '1-0-1 (Morning-Night)', '5 days']
          );
        }
        if (filled) {
          await client.query(
            'INSERT INTO fills (prescription_id, pharmacy_id) VALUES ($1, $2)',
            [rxId, pharmacy1]
          );
        }
        return rxId;
      }

      // Doctor #1 dataset (hand-verifiable fill rates):
      //   Paracetamol on 5 rx, 4 filled  -> 80%
      //   Amoxicillin on 5 rx, 2 filled  -> 40%
      //   Ibuprofen   on 2 rx, 2 filled  -> 100%
      //   Cetirizine  on 1 rx, 0 filled  -> 0%
      const p = (name, age, gender, contact, diagnosis) => ({ name, age, gender, contact, diagnosis });

      await createRx(doctor1, p('Ravi Kumar', 34, 'Male', '9000000001', 'Fever'), ['Paracetamol', 'Amoxicillin'], true);      // rx1 filled
      await createRx(doctor1, p('Sita Devi', 29, 'Female', '9000000002', 'Throat infection'), ['Paracetamol', 'Amoxicillin'], true); // rx2 filled
      await createRx(doctor1, p('John Mathew', 45, 'Male', '9000000003', 'Back pain'), ['Paracetamol', 'Ibuprofen'], true);   // rx3 filled
      await createRx(doctor1, p('Fatima Sheikh', 52, 'Female', '9000000004', 'Joint pain'), ['Paracetamol', 'Ibuprofen'], true); // rx4 filled
      await createRx(doctor1, p('Anil Gupta', 60, 'Male', '9000000005', 'Viral fever'), ['Paracetamol', 'Amoxicillin'], false);  // rx5 pending
      await createRx(doctor1, p('Priya Menon', 27, 'Female', '9000000006', 'Sinus infection'), ['Amoxicillin'], false);       // rx6 pending
      await createRx(doctor1, p('Deepak Shah', 39, 'Male', '9000000007', 'Allergy'), ['Amoxicillin', 'Cetirizine'], false);   // rx7 pending

      // Doctor #2 gets one independent prescription (scoping check for analytics).
      await createRx(docs[1].id, p('Meena Iyer', 41, 'Female', '9000000008', 'Type 2 diabetes'), ['Metformin', 'Omeprazole'], false);
    });

    console.log('Seed complete.\n');
    console.log('SEED SUMMARY');
    console.log('  Admin:     %s / %s', config.seedAdmin.email, config.seedAdmin.password);
    console.log('  Doctor:    meera@rxtracker.local / doctor12345  (has the analytics dataset)');
    console.log('  Doctor:    arjun@rxtracker.local / doctor12345');
    console.log('  Pharmacy:  medplus@rxtracker.local / pharma12345');
    console.log('  Pharmacy:  apollo@rxtracker.local / pharma12345');
    console.log('\n  Expected fill-rate for Dr. Meera (hand-verifiable):');
    console.log('    Paracetamol 500mg : 4/5 = 80%');
    console.log('    Amoxicillin 250mg : 2/5 = 40%');
    console.log('    Ibuprofen 400mg   : 2/2 = 100%');
    console.log('    Cetirizine 10mg   : 0/1 = 0%');
    console.log('    (other catalog medicines: N/A — omitted, never appear on her prescriptions)');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
