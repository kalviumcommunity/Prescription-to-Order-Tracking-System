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

export default function AdminPharmacies() {
  const { status, data, error, retry } = useAsync(
    () => api.get('/admin/pharmacies'),
    { isEmpty: (rows) => rows.length === 0 },
  );

  return (
    <AppShell variant="navy" navItems={NAV} title="Registered Pharmacies" subtitle="Read-only system oversight" pageClassName="admin-page" navIconSize={21} topbarIconSize={19}>
      <div className="page-head"><h1>Registered Pharmacies</h1></div>

      {status === 'loading' && <SkeletonTable rows={6} columns={7} />}

      {status === 'error' && <PageError error={error} onRetry={retry} />}

      {status === 'empty' && (
        <PageEmpty
          icon={IconPharmacy}
          title="No pharmacies registered"
          message="Once pharmacies sign up for accounts, they'll be listed here for oversight."
        />
      )}

      {status === 'success' && (
        <div className="panel">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Registration ID</th><th>Type</th><th>Phone</th><th>Registered</th></tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td className="cell-primary">#{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.email}</td>
                  <td>{p.license_no || <span className="muted">—</span>}</td>
                  <td>{p.pharmacy_type || <span className="muted">—</span>}</td>
                  <td>{p.phone || <span className="muted">—</span>}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
