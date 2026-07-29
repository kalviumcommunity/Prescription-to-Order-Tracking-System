import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../hooks/useAsync.js';
import AppShell from '../../components/AppShell.jsx';
import SkeletonForm from '../../components/states/SkeletonForm.jsx';
import PageError from '../../components/states/PageError.jsx';
import PageEmpty from '../../components/states/PageEmpty.jsx';
import {
  IconDashboard, IconPlus, IconList, IconChart, IconUser, IconClipboard,
  IconTrash, IconFile, IconCheckCircle, IconShield,
} from '../../components/Icons.jsx';

const NAV = [
  { to: '/doctor', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/doctor/new', label: 'Create Prescription', icon: IconPlus },
  { to: '/doctor/prescriptions', label: 'My Prescriptions', icon: IconList },
  { to: '/doctor/analytics', label: 'Analytics', icon: IconChart },
];

const MAX_MEDICINES = 3;
const emptyLine = () => ({ medicine_id: '', dosage: '', frequency: '', duration: '' });

export default function CreatePrescription() {
  const navigate = useNavigate();
  const { status: catalogStatus, data: catalog, error: catalogError, retry: retryCatalog } = useAsync(
    () => api.get('/doctor/medicines'),
    { isEmpty: (rows) => rows.length === 0 },
  );
  const [patient, setPatient] = useState({ patient_name: '', patient_age: '', patient_gender: '', patient_contact: '', diagnosis: '' });
  const [lines, setLines] = useState([emptyLine()]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(null); // { patientName }

  const updatePatient = (k) => (e) => setPatient((p) => ({ ...p, [k]: e.target.value }));
  function updateLine(idx, key, value) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  }
  const addLine = () => setLines((ls) => (ls.length >= MAX_MEDICINES ? ls : [...ls, emptyLine()]));
  const removeLine = (idx) => setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, i) => i !== idx)));

  function resetForm() {
    setPatient({ patient_name: '', patient_age: '', patient_gender: '', patient_contact: '', diagnosis: '' });
    setLines([emptyLine()]);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    const medicines = lines
      .filter((l) => l.medicine_id !== '')
      .map((l) => ({ medicine_id: Number(l.medicine_id), dosage: l.dosage, frequency: l.frequency, duration: l.duration }));

    if (medicines.length === 0) {
      setError('Add at least one medicine from the catalog.');
      return;
    }

    setBusy(true);
    try {
      await api.post('/doctor/prescriptions', {
        patient_name: patient.patient_name,
        patient_age: Number(patient.patient_age),
        patient_gender: patient.patient_gender,
        patient_contact: patient.patient_contact,
        diagnosis: patient.diagnosis,
        medicines,
      });
      setSuccess({ patientName: patient.patient_name });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (catalogStatus === 'loading') {
    return (
      <AppShell variant="navy" navItems={NAV} title="Create Prescription" pageClassName="doctor-page" navIconSize={21} topbarIconSize={19}>
        <div className="page-head"><h1>Create New Prescription</h1></div>
        <SkeletonForm sections={2} fieldsPerSection={3} />
      </AppShell>
    );
  }

  if (catalogStatus === 'error') {
    return (
      <AppShell variant="navy" navItems={NAV} title="Create Prescription" pageClassName="doctor-page" navIconSize={21} topbarIconSize={19}>
        <div className="page-head"><h1>Create New Prescription</h1></div>
        <PageError error={catalogError} onRetry={retryCatalog} />
      </AppShell>
    );
  }

  if (catalogStatus === 'empty') {
    return (
      <AppShell variant="navy" navItems={NAV} title="Create Prescription" pageClassName="doctor-page" navIconSize={21} topbarIconSize={19}>
        <div className="page-head"><h1>Create New Prescription</h1></div>
        <PageEmpty
          icon={IconClipboard}
          title="No medicines in the catalog"
          message="The medicine catalog is empty, so prescriptions can't be created yet. Ask an administrator to seed the catalog first."
        />
      </AppShell>
    );
  }

  return (
    <AppShell variant="navy" navItems={NAV} title="Create New Prescription" search="Search patients…" pageClassName="doctor-page" navIconSize={21} topbarIconSize={19}>
      <div className="page-head"><h1>Create New Prescription</h1></div>

      <form onSubmit={onSubmit}>
        <div className="form-card">
          <div className="form-card-head">
            <div className="title"><IconUser size={22} /> Patient Details</div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Patient Name</label>
              <input className="input" placeholder="Enter patient name" value={patient.patient_name} onChange={updatePatient('patient_name')} required />
            </div>
            <div className="field">
              <label>Age</label>
              <input className="input" type="number" min="0" placeholder="Years" value={patient.patient_age} onChange={updatePatient('patient_age')} required />
            </div>
            <div className="field">
              <label>Gender</label>
              <select className="input" value={patient.patient_gender} onChange={updatePatient('patient_gender')}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="form-grid cols-2" style={{ marginTop: 14 }}>
            <div className="field">
              <label>Contact Number</label>
              <input className="input" placeholder="+91 Mobile number" value={patient.patient_contact} onChange={updatePatient('patient_contact')} required />
            </div>
            <div className="field">
              <label>Diagnosis / Notes</label>
              <input className="input" placeholder="Primary diagnosis" value={patient.diagnosis} onChange={updatePatient('diagnosis')} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-head">
            <div className="title"><IconClipboard size={22} /> Prescribed Medicines</div>
            <span className="cap-badge">{MAX_MEDICINES} Medicines Max per block</span>
          </div>

          {lines.map((line, idx) => (
            <div key={idx} className="med-line">
              <div className="field">
                <label>Medicine Name</label>
                <select className="input" value={line.medicine_id} onChange={(e) => updateLine(idx, 'medicine_id', e.target.value)}>
                  <option value="">Search medicine (e.g. Paracetamol)</option>
                  {catalog.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} {m.strength} ({m.form})</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Dosage</label>
                <input className="input" placeholder="e.g., 500mg" value={line.dosage} onChange={(e) => updateLine(idx, 'dosage', e.target.value)} />
              </div>
              <div className="field">
                <label>Frequency</label>
                <input className="input" placeholder="1-0-1 (Morning-Night)" value={line.frequency} onChange={(e) => updateLine(idx, 'frequency', e.target.value)} />
              </div>
              <div className="field">
                <label>Duration</label>
                <input className="input" placeholder="e.g., 5 days" value={line.duration} onChange={(e) => updateLine(idx, 'duration', e.target.value)} />
              </div>
              <button type="button" className="med-line-remove" onClick={() => removeLine(idx)} disabled={lines.length === 1} title="Remove">
                <IconTrash size={19} />
              </button>
            </div>
          ))}

          <button type="button" className="add-med-link" onClick={addLine} disabled={lines.length >= MAX_MEDICINES}>
            <IconPlus size={18} /> Add Another Medicine
          </button>
        </div>

        {error && <div className="state state-error">{error}</div>}

        <div className="form-footer-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/doctor')}>Cancel</button>
          <button type="submit" className="btn btn-coral" disabled={busy}>
            <IconFile size={19} /> {busy ? 'Generating…' : 'Generate Prescription'}
          </button>
        </div>
      </form>

      <div className="promo-banner">
        <div className="promo-copy">
          <h3>Structured Prescriptions at Scale</h3>
          <p>
            Every prescription created here is recorded against the normalized medicine catalog and
            tracked through to pharmacy fulfillment, so fill-rate patterns are visible instead of anecdotal.
          </p>
          <div className="promo-badges">
            <span className="promo-badge"><IconShield size={16} /> Catalog Verified</span>
            <span className="promo-badge"><IconCheckCircle size={16} /> Audit-Ready Records</span>
          </div>
        </div>
        <div className="promo-art">
          <IconClipboard size={96} />
        </div>
      </div>

      {success && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-icon tone-success"><IconCheckCircle size={34} /></div>
            <h2>Prescription created successfully</h2>
            <p className="desc">The prescription for {success.patientName} has been saved and added to your prescriptions list.</p>
            <div className="modal-actions">
              <button className="btn btn-coral btn-block" onClick={() => navigate('/doctor/prescriptions')}>View prescription</button>
              <button className="btn btn-outline btn-block" onClick={() => { setSuccess(null); resetForm(); }}>Create another</button>
            </div>
            <div className="modal-caption"><IconShield size={16} /> Recorded in the prescription tracker</div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
