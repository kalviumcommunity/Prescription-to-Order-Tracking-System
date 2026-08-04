'use strict';

// Standalone double-fill concurrency check.
//
// Sets up a throwaway doctor / pharmacy / pending prescription, then fires N
// concurrent PATCH .../fill requests at the SAME prescription. Asserts:
//   - exactly ONE request succeeds (200),
//   - every other request is rejected with code 'already_filled' (409),
//   - the fills table ends up with exactly ONE row for that prescription.
//
// Run with the DB up and migrated:  npm run test:concurrency

const app = require('../src/index');
const { pool } = require('../src/db');
const { signToken } = require('../src/utils/token');
const { hashPassword } = require('../src/utils/password');

const N = 10;
const TEST_PORT = 4100;

async function setupFixtures() {
  const stamp = Date.now();
  const hash = await hashPassword('test12345');

  const { rows: doc } = await pool.query(
    'INSERT INTO doctors (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    ['Concurrency Doc', `cdoc_${stamp}@test.local`, hash]
  );
  const { rows: ph } = await pool.query(
    'INSERT INTO pharmacies (name, email, password_hash, license_no) VALUES ($1, $2, $3, $4) RETURNING id',
    ['Concurrency Pharma', `cpharma_${stamp}@test.local`, hash, 'LIC-TEST']
  );
  const { rows: med } = await pool.query(
    'INSERT INTO medicines (name, form, strength) VALUES ($1, $2, $3) RETURNING id',
    [`TestMed_${stamp}`, 'Tablet', '100mg']
  );
  const { rows: rx } = await pool.query(
    `INSERT INTO prescriptions (doctor_id, patient_name, patient_age, patient_contact)
     VALUES ($1, 'Test Patient', 30, '9999999999') RETURNING id`,
    [doc[0].id]
  );
  await pool.query(
    'INSERT INTO prescription_medicines (prescription_id, medicine_id, dosage, frequency, duration) VALUES ($1, $2, $3, $4, $5)',
    [rx[0].id, med[0].id, '500mg', '1-0-1', '5 days']
  );

  return {
    doctorId: doc[0].id,
    pharmacyId: ph[0].id,
    medicineId: med[0].id,
    prescriptionId: rx[0].id,
  };
}

async function cleanupFixtures(f) {
  await pool.query('DELETE FROM fills WHERE prescription_id = $1', [f.prescriptionId]);
  await pool.query('DELETE FROM prescription_medicines WHERE prescription_id = $1', [f.prescriptionId]);
  await pool.query('DELETE FROM prescriptions WHERE id = $1', [f.prescriptionId]);
  await pool.query('DELETE FROM medicines WHERE id = $1', [f.medicineId]);
  await pool.query('DELETE FROM doctors WHERE id = $1', [f.doctorId]);
  await pool.query('DELETE FROM pharmacies WHERE id = $1', [f.pharmacyId]);
}

async function main() {
  let server;
  let fixtures;
  let failed = false;

  try {
    fixtures = await setupFixtures();
    const token = signToken({ id: fixtures.pharmacyId, role: 'pharmacy', email: 'cpharma@test.local' });

    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, resolve);
    });

    const url = `http://localhost:${TEST_PORT}/api/pharmacy/prescriptions/${fixtures.prescriptionId}/fill`;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    console.log(`Firing ${N} concurrent fill requests at prescription #${fixtures.prescriptionId}...\n`);

    const responses = await Promise.all(
      Array.from({ length: N }, () =>
        fetch(url, { method: 'PATCH', headers })
          .then(async (r) => ({ status: r.status, body: await r.json() }))
          .catch((err) => ({ status: 0, body: { code: 'network_error', error: err.message } }))
      )
    );

    const successes = responses.filter((r) => r.status === 200);
    const alreadyFilled = responses.filter((r) => r.status === 409 && r.body.code === 'already_filled');
    const others = responses.filter((r) => r.status !== 200 && r.body.code !== 'already_filled');

    const { rows: fillRows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM fills WHERE prescription_id = $1',
      [fixtures.prescriptionId]
    );
    const fillCount = fillRows[0].count;

    console.log(`  successes (200):            ${successes.length}`);
    console.log(`  already_filled (409):       ${alreadyFilled.length}`);
    console.log(`  other/unexpected responses: ${others.length}`);
    console.log(`  rows in fills table:        ${fillCount}\n`);

    const ok =
      successes.length === 1 &&
      alreadyFilled.length === N - 1 &&
      others.length === 0 &&
      fillCount === 1;

    if (ok) {
      console.log('PASS: exactly one fill succeeded; all others rejected; one fills row exists.');
    } else {
      failed = true;
      console.error('FAIL: double-fill invariant violated.');
      if (others.length > 0) console.error('  unexpected responses:', JSON.stringify(others, null, 2));
    }
  } catch (err) {
    failed = true;
    console.error('Test errored:', err);
  } finally {
    if (fixtures) {
      try {
        await cleanupFixtures(fixtures);
      } catch (err) {
        console.error('Cleanup failed:', err.message);
      }
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
    // Set exitCode and let the event loop drain naturally. Calling process.exit()
    // here races handle teardown and trips a libuv assertion on Windows.
    process.exitCode = failed ? 1 : 0;
  }
}

main();
