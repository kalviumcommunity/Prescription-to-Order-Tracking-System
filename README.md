# Prescription-to-Order Tracking System

A three-role (Doctor / Pharmacy / Admin) platform modeled on a Tata 1mg-style workflow.
Doctors issue multi-medicine prescriptions, pharmacies mark them **filled exactly once**,
and doctors see **fill-rate analytics per medicine**. A prescription can never be filled
twice — guaranteed both by an atomic transactional update and a database-level UNIQUE constraint.

**Stack:** Node.js + Express + PostgreSQL (API) · React + Vite (SPA) · JavaScript · Docker Compose for Postgres.

The UI follows a Figma design (navy split-screen auth, navy doctor dashboard, maroon pharmacy
dashboard, coral accents). A few fields shown in the design that weren't in the original PRD schema
were added for real (doctor specialization/license/phone, pharmacy type/phone, patient
gender/diagnosis, per-medicine dosage/frequency/duration, a pharmacy Filled History view) — see
`server/db/schema.sql` and `server/src/routes/*` for what's live vs. cosmetic (e.g. the "Continue
with Google" button is visual-only; there's no OAuth wired up).

---

## Prerequisites

- **Node.js 18+** (uses the built-in `fetch` in the concurrency test)
- **Docker Desktop** (for PostgreSQL) — or a local PostgreSQL 16 if you prefer

## 1. Start PostgreSQL

```bash
docker compose up -d
```

This starts `postgres:16` on **`localhost:5433`** (host port `5433` → container `5432`, chosen to avoid
clashing with a local PostgreSQL install on 5432) with db `rxtracker` / user `rxuser` / password `rxpass`.

## 2. Configure the server

```bash
cp .env.example server/.env
```

The defaults already match `docker-compose.yml`. Adjust `JWT_SECRET` for anything beyond local dev.

## 3. Install, migrate, seed

```bash
cd server
npm install
npm run db:migrate      # creates tables, enum, constraints, indexes
npm run db:seed         # seeds admin, medicines, sample doctors/pharmacies/prescriptions
```

The seed prints login credentials and the **hand-verifiable expected fill rates** for Dr. Meera.

## 4. Run the API

```bash
# from server/
npm run dev             # http://localhost:4000  (nodemon)
```

## 5. Run the SPA

```bash
cd client
npm install
npm run dev             # http://localhost:5173  (proxies /api -> :4000)
```

Open http://localhost:5173.

---

## Seeded accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@rxtracker.local | admin12345 |
| Doctor | meera@rxtracker.local | doctor12345 |
| Doctor | arjun@rxtracker.local | doctor12345 |
| Pharmacy | medplus@rxtracker.local | pharma12345 |
| Pharmacy | apollo@rxtracker.local | pharma12345 |

Dr. Meera's seeded fill rates (verify against the Analytics screen):
Paracetamol 80% · Amoxicillin 40% · Ibuprofen 100% · Cetirizine 0%.

---

## Double-fill concurrency test

```bash
# from server/  (DB must be up + migrated)
npm run test:concurrency
```

Fires 10 concurrent fill requests at one prescription and asserts **exactly one** succeeds,
the rest return `already_filled`, and the `fills` table has exactly one row.

**How safety is guaranteed (two independent layers):**

1. **Atomic guarded update in a transaction** (`server/src/services/fillService.js`):
   `UPDATE prescriptions SET status='filled' WHERE id=$1 AND status='pending'` — only one of two
   concurrent requests can affect a row; the `fills` INSERT happens only if that update changed
   exactly one row, all inside one `BEGIN…COMMIT`.
2. **DB-level UNIQUE constraint** on `fills.prescription_id` (`server/db/schema.sql`) — an independent
   backstop that makes a second fill row impossible even if application logic had a bug.

---

## API surface (base `/api`)

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/auth/register/doctor` | Public |
| POST | `/auth/register/pharmacy` | Public |
| POST | `/auth/login` | Public (`{ email, password, role }`) |
| POST | `/admin/register` | Admin |
| GET  | `/doctor/medicines` | Doctor (catalog for the picker) |
| POST | `/doctor/prescriptions` | Doctor |
| GET  | `/doctor/prescriptions` | Doctor |
| GET  | `/doctor/analytics/fill-rate` | Doctor |
| GET  | `/doctor/stats` | Doctor (dashboard totals) |
| GET  | `/pharmacy/prescriptions?status=pending` | Pharmacy |
| PATCH| `/pharmacy/prescriptions/:id/fill` | Pharmacy |
| GET  | `/pharmacy/filled-history` | Pharmacy (own filled prescriptions) |
| GET  | `/pharmacy/stats` | Pharmacy (dashboard totals) |
| GET  | `/admin/doctors` | Admin |
| GET  | `/admin/pharmacies` | Admin |
| GET  | `/admin/prescriptions` | Admin |

Auth: JWT with a `role` claim. Missing/expired/malformed token → **401**; valid token on the wrong
role's route → **403**.

---

## Project layout

```
docker-compose.yml        PostgreSQL 16
server/
  db/schema.sql           tables, enum, constraints, indexes
  db/migrate.js           applies schema (--reset to drop first)
  db/seed.js              reproducible demo dataset
  src/routes/             auth, doctor, pharmacy, admin
  src/services/           prescription, fill (concurrency-safe), analytics
  src/middleware/         auth (401 vs 403), error handler
  test/concurrency.test.js
client/
  src/pages/              login, register, doctor/*, pharmacy/*, admin/*
  src/auth/               AuthContext (JWT in localStorage)
  src/api.js              fetch wrapper
```

## Useful scripts (server/)

- `npm run db:migrate` · `npm run db:migrate -- --reset` (drop + recreate)
- `npm run db:seed` · `npm run db:reset` (reset schema then seed)
- `npm run dev` · `npm start`
- `npm run test:concurrency`
