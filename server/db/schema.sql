-- Prescription-to-Order Tracking System — schema
-- Idempotent: safe to run repeatedly.

-- Prescription lifecycle status. Only 'pending' -> 'filled' is allowed.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prescription_status') THEN
    CREATE TYPE prescription_status AS ENUM ('pending', 'filled');
  END IF;
END$$;

-- Three separate role tables, each with its own independent unique-email constraint.
CREATE TABLE IF NOT EXISTS doctors (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  license_no     TEXT,
  specialization TEXT,
  phone          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pharmacies (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  license_no     TEXT,
  pharmacy_type  TEXT,
  phone          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Normalized master catalog. Doctors reference these; they cannot add ad hoc.
CREATE TABLE IF NOT EXISTS medicines (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  form     TEXT,
  strength TEXT,
  UNIQUE (name, form, strength)
);

-- Patient details are embedded (no separate patient table / login).
CREATE TABLE IF NOT EXISTS prescriptions (
  id              SERIAL PRIMARY KEY,
  doctor_id       INTEGER NOT NULL REFERENCES doctors(id),
  patient_name    TEXT NOT NULL,
  patient_age     INTEGER NOT NULL,
  patient_gender  TEXT,
  patient_contact TEXT NOT NULL,
  diagnosis       TEXT,
  status          prescription_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Join table resolving the many-to-many between prescriptions and medicines.
-- A prescription may carry at most 3 medicine lines (enforced in application code).
CREATE TABLE IF NOT EXISTS prescription_medicines (
  id               SERIAL PRIMARY KEY,
  prescription_id  INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_id      INTEGER NOT NULL REFERENCES medicines(id),
  dosage           TEXT,
  frequency        TEXT,
  duration         TEXT
);

-- The UNIQUE constraint on prescription_id is the hard, DB-level double-fill backstop:
-- even a logic bug upstream cannot produce two fill rows for one prescription.
CREATE TABLE IF NOT EXISTS fills (
  id              SERIAL PRIMARY KEY,
  prescription_id INTEGER NOT NULL UNIQUE REFERENCES prescriptions(id),
  pharmacy_id     INTEGER NOT NULL REFERENCES pharmacies(id),
  filled_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor  ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status  ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_pm_prescription       ON prescription_medicines(prescription_id);
CREATE INDEX IF NOT EXISTS idx_pm_medicine           ON prescription_medicines(medicine_id);
