import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DoctorDashboard from './pages/doctor/Dashboard.jsx';
import DoctorPrescriptions from './pages/doctor/Prescriptions.jsx';
import CreatePrescription from './pages/doctor/CreatePrescription.jsx';
import Analytics from './pages/doctor/Analytics.jsx';
import PharmacyDashboard from './pages/Pharmacy/Dashboard.jsx';
import PendingPrescriptions from './pages/Pharmacy/PendingPrescriptions.jsx';
import FilledHistory from './pages/Pharmacy/FilledHistory.jsx';
import AdminDoctors from './pages/Admin/Doctors.jsx';
import AdminPharmacies from './pages/Admin/Pharmacies.jsx';
import AdminPrescriptions from './pages/Admin/AllPrescriptions.jsx';

// Sends an authenticated user to their role's home; otherwise to login.
function Home() {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  const home = { doctor: '/doctor', pharmacy: '/pharmacy', admin: '/admin/doctors' }[auth.role];
  return <Navigate to={home || '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Doctor */}
      <Route path="/doctor" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/new" element={<ProtectedRoute role="doctor"><CreatePrescription /></ProtectedRoute>} />
      <Route path="/doctor/prescriptions" element={<ProtectedRoute role="doctor"><DoctorPrescriptions /></ProtectedRoute>} />
      <Route path="/doctor/analytics" element={<ProtectedRoute role="doctor"><Analytics /></ProtectedRoute>} />

      {/* Pharmacy */}
      <Route path="/pharmacy" element={<ProtectedRoute role="pharmacy"><PharmacyDashboard /></ProtectedRoute>} />
      <Route path="/pharmacy/pending" element={<ProtectedRoute role="pharmacy"><PendingPrescriptions /></ProtectedRoute>} />
      <Route path="/pharmacy/filled-history" element={<ProtectedRoute role="pharmacy"><FilledHistory /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/doctors" element={<ProtectedRoute role="admin"><AdminDoctors /></ProtectedRoute>} />
      <Route path="/admin/pharmacies" element={<ProtectedRoute role="admin"><AdminPharmacies /></ProtectedRoute>} />
      <Route path="/admin/prescriptions" element={<ProtectedRoute role="admin"><AdminPrescriptions /></ProtectedRoute>} />

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
