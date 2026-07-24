import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { IconStethoscope, IconPharmacy, IconAdmin, IconMail, IconLock, IconEye } from '../components/Icons.jsx';

const ROLES = [
  { key: 'doctor', label: 'Doctor', icon: IconStethoscope, placeholder: 'e.g. dr.sharma@1mg.com' },
  { key: 'pharmacy', label: 'Pharmacy', icon: IconPharmacy, placeholder: 'e.g. apolloDelhi@1mg.com' },
  { key: 'admin', label: 'Admin', icon: IconAdmin, placeholder: 'e.g. admin@1mg.com' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('doctor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const roleMeta = ROLES.find((r) => r.key === role);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await login(email, password, role);
      const home = { doctor: '/doctor', pharmacy: '/pharmacy', admin: '/admin/doctors' }[data.role];
      navigate(home || '/');
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
          <h1>Connecting Care,<br /><em>Seamlessly</em></h1>
          <p className="lede">
            The precision ecosystem for healthcare professionals to manage prescriptions with
            unmatched accuracy and speed.
          </p>

          <div className="auth-diagram">
            <div className="auth-diagram-inner">
              <div className="diagram-line" />
              <div className="diagram-node top"><IconStethoscope size={19} /> Doctors</div>
              <div className="diagram-node center"><IconPharmacy size={24} /></div>
              <div className="diagram-node bottom"><IconPharmacy size={19} />Pharmacies</div>
            </div>
          </div>

          <div className="auth-stats">
            <div className="stat"><b>12,400+</b><span>Doctors</span></div>
            <div className="stat"><b>8,200+</b><span>Pharmacies</span></div>
            <div className="stat"><b>98.6%</b><span>Accuracy</span></div>
          </div>
        </div>

        <div className="auth-form-side">
          <h1>Welcome back</h1>
          <p className="lede">Sign in to your account to continue</p>

          <form onSubmit={onSubmit}>
            <div className="field">
              <label>I am a</label>
              <div className="role-tabs">
                {ROLES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    className={`role-tab ${role === r.key ? 'active' : ''}`}
                    onClick={() => setRole(r.key)}
                  >
                    <r.icon size={21} /> {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Email / Username</label>
              <div className="input-wrap">
                <span className="icon-lead"><IconMail size={22} /></span>
                <input
                  className="input has-lead"
                  type="email"
                  placeholder={roleMeta.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>Password</label>
              <div className="input-wrap">
                <span className="icon-lead"><IconLock size={22} /></span>
                <input
                  className="input has-lead has-trail"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="icon-trail" onClick={() => setShowPassword((s) => !s)}>
                  <IconEye size={22} />
                </button>
              </div>
            </div>

            <div className="checkbox-row">
              <label><input type="checkbox" /> Remember me</label>
              <a href="#forgot" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </div>

            {error && <div className="state state-error">{error}</div>}

            <button className="btn btn-coral btn-block" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Log In →'}
            </button>
          </form>

          <p className="auth-footer-link" style={{ marginTop: 22 }}>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
