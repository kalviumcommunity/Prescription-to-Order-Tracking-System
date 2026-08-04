import { api } from '../../api';
import { useAsync } from '../../hooks/useAsync.js';
import AppShell from '../../components/AppShell.jsx';
import SkeletonStatGrid from '../../components/states/SkeletonStatGrid.jsx';
import SkeletonTable from '../../components/states/SkeletonTable.jsx';
import PageError from '../../components/states/PageError.jsx';
import PageEmpty from '../../components/states/PageEmpty.jsx';
import { IconDashboard, IconHistory, IconClipboard, IconShield } from '../../components/Icons.jsx';

const NAV = [
  { to: '/pharmacy', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/pharmacy/pending', label: 'Pending Prescriptions', icon: IconClipboard },
  { to: '/pharmacy/filled-history', label: 'Filled History', icon: IconHistory },
];

function fmtDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  const s = Math.round(Number(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default function FilledHistory() {
  const { status, data, error, retry } = useAsync(() => Promise.all([
    api.get('/pharmacy/filled-history'),
    api.get('/pharmacy/stats'),
  ]).then(([history, stats]) => ({ history, stats })), {
    isEmpty: ({ history }) => history.length === 0,
  });

  return (
    <AppShell variant="maroon" navItems={NAV} search="Search prescriptions, patients, or IDs…" pageClassName="pharmacy-page" navIconSize={21} topbarIconSize={19}>
      <div className="page-head">
        <div>
          <h1>Filled History</h1>
          <p>A comprehensive record of all prescriptions you've processed.</p>
        </div>
      </div>

      {status === 'loading' && (
        <>
          <SkeletonStatGrid count={3} />
          <SkeletonTable rows={6} columns={6} />
        </>
      )}

      {status === 'error' && <PageError error={error} onRetry={retry} />}

      {status === 'empty' && (
        <PageEmpty
          icon={IconHistory}
          title="No filled prescriptions yet"
          message="Once you mark a prescription as filled, it'll appear here with a full audit trail."
        />
      )}

      {status === 'success' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total Processed</div>
              <div className="stat-value">{data.stats.filled_by_you_total.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Fulfillment Time</div>
              <div className="stat-value">{fmtDuration(data.stats.avg_fulfillment_seconds)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Filled Today</div>
              <div className="stat-value">{data.stats.filled_today}</div>
            </div>
          </div>

          <div className="panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prescription ID</th><th>Patient Name</th><th>Medicines</th>
                  <th>Prescribing Doctor</th><th>Date Filled</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((rx) => (
                  <tr key={rx.id}>
                    <td className="cell-primary">#RX-{String(rx.id).padStart(4, '0')}</td>
                    <td>{rx.patient_name}<div className="cell-sub">{rx.patient_age}{rx.patient_gender ? `, ${rx.patient_gender}` : ''}</div></td>
                    <td>{rx.medicines.map((m) => <span key={m.id} className="med-tag">{m.name}</span>)}</td>
                    <td>{rx.doctor_name}</td>
                    <td>{new Date(rx.filled_at).toLocaleString()}</td>
                    <td><span className="pill pill-filled">Filled</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="panel-footer">
              <span><IconShield size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Showing {data.history.length} filled prescriptions</span>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
