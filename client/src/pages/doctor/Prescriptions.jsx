import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../hooks/useAsync.js';
import AppShell from '../../components/AppShell.jsx';
import { StatusPill } from '../../components/Ui.jsx';
import SkeletonTable from '../../components/states/SkeletonTable.jsx';
import PageError from '../../components/states/PageError.jsx';
import PageEmpty from '../../components/states/PageEmpty.jsx';
import { IconDashboard, IconPlus, IconList, IconChart, IconFile } from '../../components/Icons.jsx';

const NAV = [
  { to: '/doctor', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/doctor/new', label: 'Create Prescription', icon: IconPlus },
  { to: '/doctor/prescriptions', label: 'My Prescriptions', icon: IconList },
  { to: '/doctor/analytics', label: 'Analytics', icon: IconChart },
];

export default function DoctorPrescriptions() {
  const { status, data, error, retry } = useAsync(
    () => api.get('/doctor/prescriptions'),
    { isEmpty: (rows) => rows.length === 0 },
  );

  return (
    <AppShell variant="navy" navItems={NAV} title="My Prescriptions" subtitle="Everything you've issued, newest first" pageClassName="doctor-page" navIconSize={21} topbarIconSize={19}>
      <div className="page-head">
        <div><h1>My Prescriptions</h1></div>
        <Link className="btn btn-coral" to="/doctor/new"><IconPlus size={19} /> New Prescription</Link>
      </div>

      {status === 'loading' && <SkeletonTable rows={6} columns={7} />}

      {status === 'error' && <PageError error={error} onRetry={retry} />}

      {status === 'empty' && (
        <PageEmpty
          icon={IconFile}
          title="No prescriptions yet"
          message="Prescriptions you issue will show up here. Create your first one to start tracking fulfillment."
          action={<Link className="btn btn-coral" to="/doctor/new"><IconPlus size={17} /> Create Prescription</Link>}
        />
      )}

      {status === 'success' && (
        <div className="panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Prescription ID</th><th>Patient</th><th>Medicines</th><th>Diagnosis</th>
                <th>Date</th><th>Status</th><th>Filled By</th>
              </tr>
            </thead>
            <tbody>
              {data.map((rx) => (
                <tr key={rx.id}>
                  <td className="cell-primary">#RX-{String(rx.id).padStart(4, '0')}</td>
                  <td>{rx.patient_name}<div className="cell-sub">{rx.patient_age}{rx.patient_gender ? `, ${rx.patient_gender}` : ''} · {rx.patient_contact}</div></td>
                  <td>
                    {rx.medicines.map((m) => (
                      <span key={m.id} className="med-tag">{m.name} {m.strength}</span>
                    ))}
                  </td>
                  <td>{rx.diagnosis || <span className="muted">—</span>}</td>
                  <td>{new Date(rx.created_at).toLocaleDateString()}</td>
                  <td><StatusPill status={rx.status} /></td>
                  <td>{rx.filled_by_pharmacy || <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
