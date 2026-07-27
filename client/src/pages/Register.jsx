import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { IconStethoscope, IconPharmacy, IconShield } from '../components/Icons.jsx';

const SPECIALIZATIONS = ['General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician', 'Orthopedic', 'ENT Specialist'];
const PHARMACY_TYPES = ['Retail', 'Hospital', 'Wholesale', 'Online'];

const emptyForm = {
  name: '', license_no: '', specialization: SPECIALIZATIONS[0], pharmacy_type: PHARMACY_TYPES[0],
  email: '', phone: '', password: '', confirm: '',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('doctor');
  const [form, setForm] = useState(emptyForm);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!agree) {
      setError('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        ...(role === 'doctor'
          ? { license_no: form.license_no, specialization: form.specialization }
          : { license_no: form.license_no, pharmacy_type: form.pharmacy_type }),
      };
      const data = await register(role, payload);
      navigate(data.role === 'pharmacy' ? '/pharmacy' : '/doctor');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-panel">
          <div className="auth-brand"><b>Tata</b> 1mg</div>
          <h1>Join the Healthcare<br />Network</h1>
          <p className="lede">
            Register your credentials to start issuing and tracking prescriptions with clinical
            precision. Connect with the 1mg medical ecosystem seamlessly.
          </p>
          <div style={{ flex: 1 }} />
          <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 20 }}>
            <p style={{ color: '#b9bfd6', marginBottom: 15, fontSize: 15 }}>Joined by 10k+ Specialists</p>
            <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 13, padding: '16px 18px' }}>
              <p style={{ fontStyle: 'italic', color: '#e4e7f5', fontSize: 16, lineHeight: 1.6 }}>
                "The most intuitive prescription platform I've used in clinical practice."
              </p>
              <p style={{ color: '#b9bfd6', marginTop: 9, fontSize: 15 }}>— Dr. Aris Mehta, Cardiologist</p>
            </div>
          </div>
        </div>

        <div className="auth-form-side">
          <h1>Create an account</h1>
          <p className="lede">Register your credentials to join the network</p>

          <form onSubmit={onSubmit}>
            <div className="role-tabs">
              <button type="button" className={`role-tab ${role === 'doctor' ? 'active' : ''}`} onClick={() => setRole('doctor')}>
                <IconStethoscope size={17} /> Doctor
              </button>
              <button type="button" className={`role-tab ${role === 'pharmacy' ? 'active' : ''}`} onClick={() => setRole('pharmacy')}>
                <IconPharmacy size={17} /> Pharmacy
              </button>
            </div>

            <div className="verify-banner">
              <span className="shield"><IconShield size={20} /></span>
              <div>
                <b>License verification required</b>
                <span>All registrations are subject to manual verification of medical licenses against the MCI/PCI registry.</span>
              </div>
            </div>

            <div className="field">
              <label>{role === 'doctor' ? 'Full Name' : 'Pharmacy Name'}</label>
              <input
                className="input"
                placeholder={role === 'doctor' ? 'Dr. Jane Smith' : 'Tata 1mg Central Pharmacy'}
                value={form.name}
                onChange={update('name')}
                required
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label>{role === 'doctor' ? 'Medical License No.' : 'Registration ID'}</label>
                <input
                  className="input"
                  placeholder={role === 'doctor' ? 'MCI-12345' : 'PCI-PH-98765'}
                  value={form.license_no}
                  onChange={update('license_no')}
                  required
                />
                <span className="hint">Used for regulatory verification</span>
              </div>
              <div className="field">
                <label>{role === 'doctor' ? 'Specialization' : 'Pharmacy Type'}</label>
                <select className="input" value={role === 'doctor' ? form.specialization : form.pharmacy_type}
                  onChange={update(role === 'doctor' ? 'specialization' : 'pharmacy_type')}>
                  {(role === 'doctor' ? SPECIALIZATIONS : PHARMACY_TYPES).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Email Address</label>
                <input className="input" type="email" placeholder="name@medical.com" value={form.email} onChange={update('email')} required />
              </div>
              <div className="field">
                <label>Phone Number</label>
                <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={update('phone')} required />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Password</label>
                <input className="input" type="password" minLength={6} value={form.password} onChange={update('password')} required />
              </div>
              <div className="field">
                <label>Confirm Password</label>
                <input className="input" type="password" minLength={6} value={form.confirm} onChange={update('confirm')} required />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15.5, color: 'var(--text-soft)' }}>
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
              I agree to the <a href="#tos" onClick={(e) => e.preventDefault()} style={{ color: 'var(--coral)', fontWeight: 600 }}>Terms &amp; Conditions</a>
              &nbsp;and <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: 'var(--coral)', fontWeight: 600 }}>Privacy Policy</a>.
            </label>

            {error && <div className="state state-error">{error}</div>}

            <button className="btn btn-coral btn-block" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create Account →'}
            </button>
          </form>

          <p className="auth-footer-link" style={{ marginTop: 18 }}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
