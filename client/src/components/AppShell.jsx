import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { IconLogout } from './Icons.jsx';

// variant: 'navy' (doctor / admin) | 'maroon' (pharmacy)
export default function AppShell({ variant, navItems, pageClassName, navIconSize = 17, children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={`app-shell ${pageClassName || ''}`}>
      <aside className={`sidebar variant-${variant}`}>
        <div className="sidebar-brand">
          <div className="name">Tata 1mg</div>
          <div className="tag">Clinical Integrity</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <item.icon size={navIconSize} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-logout" onClick={() => { logout(); navigate('/login'); }}>
          <IconLogout size={navIconSize} />
          Logout
        </button>
      </aside>

      <div className="main-area">
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
