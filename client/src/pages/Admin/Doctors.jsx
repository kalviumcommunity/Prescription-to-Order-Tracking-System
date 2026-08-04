import { api } from '../../api';
import { useAsync } from '../../hooks/useAsync.js';
import AppShell from '../../components/AppShell.jsx';
import SkeletonTable from '../../components/states/SkeletonTable.jsx';
import PageError from '../../components/states/PageError.jsx';
import PageEmpty from '../../components/states/PageEmpty.jsx';
import { IconStethoscope, IconPharmacy, IconList } from '../../components/Icons.jsx';

const NAV = [
  { to: '/admin/doctors', label: 'Doctors', icon: IconStethoscope, end: true },
  { to: '/admin/pharmacies', label: 'Pharmacies', icon: IconPharmacy },
  { to: '/admin/prescriptions', label: 'All Prescriptions', icon: IconList },
];

export default function AdminDoctors() {
  const { status, data, error, retry } = useAsync(
    () => api.get('/admin/doctors'),
    { isEmpty: (rows) => rows.length === 0 },
  );

  return (
    <AppShell variant="navy" navItems={NAV} title="Registered Doctors" subtitle="Read-only system oversight" pageClassName="admin-page" navIconSize={21} topbarIconSize={19}>
      <div className="page-head"><h1>Registered Doctors</h1></div>

      {status === 'loading' && <SkeletonTable rows={6} columns={7} />}

      {status === 'error' && <PageError error={error} onRetry={retry} />}

      {status === 'empty' && (
        <PageEmpty
          icon={IconStethoscope}
          title="No doctors registered"
          message="Once doctors sign up for accounts, they'll be listed here for oversight."
        />
      )}

      {status === 'success' && (
        <div className="panel">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>License No.</th><th>Specialization</th><th>Phone</th><th>Registered</th></tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id}>
                  <td className="cell-primary">#{d.id}</td>
                  <td>{d.name}</td>
                  <td>{d.email}</td>
                  <td>{d.license_no || <span className="muted">—</span>}</td>
                  <td>{d.specialization || <span className="muted">—</span>}</td>
                  <td>{d.phone || <span className="muted">—</span>}</td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
