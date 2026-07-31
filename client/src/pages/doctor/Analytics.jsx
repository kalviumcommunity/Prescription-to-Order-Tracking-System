import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../hooks/useAsync.js';
import AppShell from '../../components/AppShell.jsx';
import SkeletonTable from '../../components/states/SkeletonTable.jsx';
import PageError from '../../components/states/PageError.jsx';
import PageEmpty from '../../components/states/PageEmpty.jsx';
import { IconDashboard, IconPlus, IconList, IconChart } from '../../components/Icons.jsx';

const NAV = [
  { to: '/doctor', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/doctor/new', label: 'Create Prescription', icon: IconPlus },
  { to: '/doctor/prescriptions', label: 'My Prescriptions', icon: IconList },
  { to: '/doctor/analytics', label: 'Analytics', icon: IconChart },
];

// Fill-rate per medicine. Medicines with zero prescriptions are omitted server-side
// (they'd be misleading as 0%), so everything shown here has a real denominator.
export default function Analytics() {
  const { status, data, error, retry } = useAsync(
    () => api.get('/doctor/analytics/fill-rate'),
    { isEmpty: (rows) => rows.length === 0 },
  );

  return (
    <AppShell variant="navy" navItems={NAV} title="Fill-Rate Analytics" subtitle="Per medicine, across your own prescriptions only" pageClassName="doctor-page" navIconSize={21} topbarIconSize={19}>
      <div className="page-head"><h1>Fill-Rate Analytics</h1><p>Per medicine, across your own prescriptions only.</p></div>

      {status === 'loading' && <SkeletonTable rows={4} columns={5} />}

      {status === 'error' && <PageError error={error} onRetry={retry} />}

      {status === 'empty' && (
        <PageEmpty
          icon={IconChart}
          title="No analytics yet"
          message="Fill-rate per medicine appears here once you've issued prescriptions and pharmacies have had a chance to fill them."
          action={<Link className="btn btn-coral" to="/doctor/new"><IconPlus size={17} /> Create a Prescription</Link>}
        />
      )}

      {status === 'success' && (
        <div className="panel">
          <table className="data-table">
            <thead>
              <tr><th>Medicine</th><th>Filled</th><th>Total</th><th>Fill Rate</th><th style={{ width: 200 }}>&nbsp;</th></tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.medicine_id}>
                  <td className="cell-primary">{row.name} {row.strength}<div className="cell-sub">{row.form}</div></td>
                  <td>{row.filled_prescriptions}</td>
                  <td>{row.total_prescriptions}</td>
                  <td>{row.fill_rate_pct === null ? 'N/A' : `${row.fill_rate_pct}%`}</td>
                  <td>
                    <div className="fillrate-bar">
                      <div
                        className={`fillrate-bar-fill ${row.fill_rate_pct !== null && row.fill_rate_pct < 50 ? 'low' : ''}`}
                        style={{ width: `${row.fill_rate_pct ?? 0}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
