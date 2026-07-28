import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import AppShell from '../../components/AppShell.jsx';
import { EmptyState, StatusPill } from '../../components/Ui.jsx';
import SkeletonStatGrid from '../../components/states/SkeletonStatGrid.jsx';
import SkeletonTable from '../../components/states/SkeletonTable.jsx';
import PageError from '../../components/states/PageError.jsx';
import { IconDashboard, IconPlus, IconFile, IconList, IconChart, IconClipboard } from '../../components/Icons.jsx';

const NAV = [
  { to: '/doctor', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/doctor/new', label: 'Create Prescription', icon: IconPlus },
  { to: '/doctor/prescriptions', label: 'My Prescriptions', icon: IconList },
  { to: '/doctor/analytics', label: 'Analytics', icon: IconChart },
];

function medTags(medicines) {
  const shown = medicines.slice(0, 2);
  const extra = medicines.length - shown.length;
  return (
    <>
      {shown.map((m) => <span key={m.id} className="med-tag">{m.name}</span>)}
      {extra > 0 && <span className="med-tag more">+{extra} more</span>}
    </>
  );
}

export default function DoctorDashboard() {
  const { auth } = useAuth();
  const { status, data, error, retry } = useAsync(() => Promise.all([
    api.get('/doctor/stats'),
    api.get('/doctor/prescriptions'),
    api.get('/doctor/analytics/fill-rate'),
  ]).then(([stats, rx, fillRate]) => ({ stats, rx, fillRate })));

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  if (status === 'loading') {
    return (
      <AppShell variant="navy" navItems={NAV} pageClassName="doctor-page" navIconSize={21} topbarIconSize={19}>
        <div className="page-head">
          <div><h1>Welcome back, {auth.user?.name}</h1><p>{today}</p></div>
        </div>
        <SkeletonStatGrid count={4} />
        <div className="dash-grid">
          <SkeletonTable rows={5} columns={5} />
          <SkeletonTable rows={5} columns={2} />
        </div>
      </AppShell>
    );
  }

  if (status === 'error') {
    return (
      <AppShell variant="navy" navItems={NAV} pageClassName="doctor-page" navIconSize={21} topbarIconSize={19}>
        <div className="page-head"><div><h1>Welcome back, {auth.user?.name}</h1></div></div>
        <PageError error={error} onRetry={retry} />
      </AppShell>
    );
  }

  const { stats, rx, fillRate } = data;

  return (
    <AppShell variant="navy" navItems={NAV} pageClassName="doctor-page" navIconSize={21} topbarIconSize={19}>
      <div className="page-head">
        <div>
          <h1>Welcome back, {auth.user?.name}</h1>
          <p> {today}</p>
        </div>
        <Link className="btn btn-coral" to="/doctor/new"><IconPlus size={22} /> Create New Prescription</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon tone-coral"><IconFile size={28} /></div>
          <div className="stat-label">Total Prescriptions</div>
          <div className="stat-value">{stats.total_prescriptions.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon tone-mint"><IconClipboard size={28} /></div>
          <div className="stat-label">Filled</div>
          <div className="stat-value">{stats.filled_prescriptions.toLocaleString()}</div>
          <div className="stat-sub">Processed by pharmacies</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon tone-coral"><IconClipboard size={28} /></div>
          <div className="stat-label">Pending</div>
          <div className="stat-value">{stats.pending_prescriptions.toLocaleString()}</div>
          <div className="stat-sub muted-sub">Awaiting patient action</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon tone-mint"><IconChart size={28} /></div>
          <div className="stat-label">Overall Fill Rate</div>
          <div className="stat-value">{stats.overall_fill_rate_pct === null ? 'N/A' : `${stats.overall_fill_rate_pct}%`}</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>My Prescriptions</h3>
            <div className="panel-actions">
              <Link className="btn btn-outline btn-sm" to="/doctor/prescriptions">View All</Link>
            </div>
          </div>
          {rx.length === 0 ? (
            <div style={{ padding: '0 22px 22px' }}>
              <EmptyState message="You haven't issued any prescriptions yet — create one to see it here." />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Prescription ID</th><th>Patient Name</th><th>Medicines</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {rx.slice(0, 5).map((r) => (
                  <tr key={r.id}>
                    <td className="cell-primary">#RX-{String(r.id).padStart(4, '0')}</td>
                    <td>{r.patient_name}<div className="cell-sub">{r.patient_age}{r.patient_gender ? `, ${r.patient_gender}` : ''}</div></td>
                    <td>{medTags(r.medicines)}</td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Fill Rate by Medicine</h3></div>
          {fillRate.length === 0 ? (
            <div style={{ padding: '0 22px 22px' }}>
              <EmptyState message="No fill-rate data yet — it appears once your prescriptions start getting filled." />
            </div>
          ) : (
            <div className="fillrate-list">
              {fillRate.slice(0, 5).map((m) => (
                <div key={m.medicine_id} className="fillrate-item">
                  <div className="fr-top">
                    <span>{m.name} {m.strength}</span>
                    <span>{m.fill_rate_pct}%</span>
                  </div>
                  <div className="fillrate-bar">
                    <div className={`fillrate-bar-fill ${m.fill_rate_pct < 50 ? 'low' : ''}`} style={{ width: `${m.fill_rate_pct}%` }} />
                  </div>
                  <div className="fr-sub">{m.filled_prescriptions}/{m.total_prescriptions} filled</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: '0 22px 22px' }}>
            <Link className="btn btn-outline btn-block btn-sm" to="/doctor/analytics">View Full Analytics</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
