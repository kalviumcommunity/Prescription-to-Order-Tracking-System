import { api } from '../../api';
import { useAsync } from '../../hooks/useAsync.js';
import AppShell from '../../components/AppShell.jsx';
import { StatusPill } from '../../components/Ui.jsx';
import SkeletonTable from '../../components/states/SkeletonTable.jsx';
import PageError from '../../components/states/PageError.jsx';
import PageEmpty from '../../components/states/PageEmpty.jsx';
import { IconStethoscope, IconPharmacy, IconList } from '../../components/Icons.jsx';

const NAV = [
  { to: '/admin/doctors', label: 'Doctors', icon: IconStethoscope, end: true },
  { to: '/admin/pharmacies', label: 'Pharmacies', icon: IconPharmacy },
  { to: '/admin/prescriptions', label: 'All Prescriptions', icon: IconList },
];

export default function AdminPrescriptions() {
  const { status, data, error, retry } = useAsync(
    () => api.get('/admin/prescriptions'),
    { isEmpty: (rows) => rows.length === 0 },
  );

  return (
    <AppShell variant="navy" navItems={NAV} title="All Prescriptions" subtitle="System-wide, read-only oversight" pageClassName="admin-page" navIconSize={21} topbarIconSize={19}>
      <div className="page-head"><h1>All Prescriptions</h1></div>

      {status === 'loading' && <SkeletonTable rows={7} columns={6} />}

      {status === 'error' && <PageError error={error} onRetry={retry} />}

      {status === 'empty' && (
        <PageEmpty
          icon={IconList}
          title="No prescriptions in the system"
          message="Once doctors start issuing prescriptions, they'll show up here with their fill status."
        />
      )}

      {status === 'success' && (
        <div className="panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Patient</th><th>Doctor</th><th>Status</th><th>Filled by</th><th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.map((rx) => (
                <tr key={rx.id}>
                  <td className="cell-primary">#RX-{String(rx.id).padStart(4, '0')}</td>
                  <td>{rx.patient_name}<div className="cell-sub">{rx.patient_age}{rx.patient_gender ? `, ${rx.patient_gender}` : ''}</div></td>
                  <td>{rx.doctor_name}</td>
                  <td><StatusPill status={rx.status} /></td>
                  <td>{rx.filled_by_pharmacy || <span className="muted">—</span>}</td>
                  <td>{new Date(rx.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
