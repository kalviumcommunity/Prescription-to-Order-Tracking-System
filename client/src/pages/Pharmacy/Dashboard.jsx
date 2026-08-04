import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import AppShell from '../../components/AppShell.jsx';
import { EmptyState } from '../../components/Ui.jsx';
import SkeletonStatGrid from '../../components/states/SkeletonStatGrid.jsx';
import SkeletonTable from '../../components/states/SkeletonTable.jsx';
import PageError from '../../components/states/PageError.jsx';
import { IconDashboard, IconHistory, IconClipboard } from '../../components/Icons.jsx';

const NAV = [
  { to: '/pharmacy', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/pharmacy/pending', label: 'Pending Prescriptions', icon: IconClipboard },
  { to: '/pharmacy/filled-history', label: 'Filled History', icon: IconHistory },
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

export default function PharmacyDashboard() {
  const { auth } = useAuth();
  const { status, data, error, retry } = useAsync(() => Promise.all([
    api.get('/pharmacy/stats'),
    api.get('/pharmacy/prescriptions?status=pending'),
    api.get('/pharmacy/filled-history'),
  ]).then(([stats, pending, filled]) => ({ stats, pending, filled })));

  if (status === 'loading') {
    return (
      <AppShell variant="maroon" navItems={NAV} pageClassName="pharmacy-page" navIconSize={21} topbarIconSize={19}>
        <div className="page-head"><div><h1>Welcome back, {auth.user?.name}</h1></div></div>
        <SkeletonStatGrid count={3} />
        <div className="dash-grid">
          <SkeletonTable rows={5} columns={5} />
          <SkeletonTable rows={5} columns={4} />
        </div>
      </AppShell>
    );
  }

  if (status === 'error') {
    return (
      <AppShell variant="maroon" navItems={NAV} pageClassName="pharmacy-page" navIconSize={21} topbarIconSize={19}>
        <div className="page-head"><div><h1>Welcome back, {auth.user?.name}</h1></div></div>
        <PageError error={error} onRetry={retry} />
      </AppShell>
    );
  }

  const { stats, pending, filled } = data;

  return (
    <AppShell variant="maroon" navItems={NAV} pageClassName="pharmacy-page" navIconSize={21} topbarIconSize={19}>
      <div className="page-head">
        <div><h1>Welcome back, {auth.user?.name}</h1></div>
        <Link className="btn btn-coral" to="/pharmacy/pending"><IconClipboard size={22} /> View Pending Prescriptions</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-badge">Urgent</span>
          <div className="stat-label">Pending Prescriptions</div>
          <div className="stat-value">{stats.pending_count}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Filled by You (Total)</div>
          <div className="stat-value">{stats.filled_by_you_total.toLocaleString()}</div>
          <div className="stat-sub">Lifetime performance</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Filled Today</div>
          <div className="stat-value">{stats.filled_today}</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>Pending Prescriptions</h3>
            <div className="panel-actions">
              <Link className="btn btn-outline btn-sm" to="/pharmacy/pending">View All</Link>
            </div>
          </div>
          {pending.length === 0 ? (
            <div style={{ padding: '0 22px 22px' }}>
              <EmptyState message="You're all caught up — no pending prescriptions right now." />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Prescription ID</th><th>Patient Name</th><th>Medicines</th><th>Doctor</th><th>Date</th></tr>
              </thead>
              <tbody>
                {pending.slice(0, 5).map((rx) => (
                  <tr key={rx.id}>
                    <td className="cell-primary">#RX-{String(rx.id).padStart(4, '0')}</td>
                    <td>{rx.patient_name}<div className="cell-sub">{rx.patient_age}{rx.patient_gender ? `, ${rx.patient_gender}` : ''}</div></td>
                    <td>{medTags(rx.medicines)}</td>
                    <td>{rx.doctor_name}</td>
                    <td>{new Date(rx.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Recently Filled</h3>
            <div className="panel-actions">
              <Link className="btn btn-outline btn-sm" to="/pharmacy/filled-history">View All</Link>
            </div>
          </div>
          {filled.length === 0 ? (
            <div style={{ padding: '0 22px 22px' }}>
              <EmptyState message="You haven't filled any prescriptions yet — they'll show up here once you do." />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Prescription ID</th><th>Patient Name</th><th>Medicines</th><th>Filled</th></tr>
              </thead>
              <tbody>
                {filled.slice(0, 5).map((rx) => (
                  <tr key={rx.id}>
                    <td className="cell-primary">#RX-{String(rx.id).padStart(4, '0')}</td>
                    <td>{rx.patient_name}<div className="cell-sub">{rx.patient_age}{rx.patient_gender ? `, ${rx.patient_gender}` : ''}</div></td>
                    <td>{medTags(rx.medicines)}</td>
                    <td>{new Date(rx.filled_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
