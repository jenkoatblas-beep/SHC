import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/registro';

  if (isAuthPage) {
    return <Outlet />;
  }

  if (!user) {
    return (
      <div className="app-container" style={{ display: 'block', overflow: 'auto', background: 'var(--surface)' }}>
        <header className="topbar" style={{ borderBottom: 'none', background: 'transparent' }}>
          <NavLink to="/" className="sidebar-brand" style={{ margin: 0, padding: 0 }}>
            <div className="logo-icon" style={{ borderRadius: '12px', background: 'var(--accent)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
            SHC
          </NavLink>
          <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <NavLink to="/login" className="btn btn-ghost" style={{ border: 'none' }}>Iniciar sesión</NavLink>
            <NavLink to="/registro" className="btn btn-ghost" style={{ border: '1px solid var(--border)' }}>Registrarse</NavLink>
          </nav>
        </header>
        <main style={{ padding: '0 2rem' }}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <NavLink to="/" className="sidebar-brand">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
          SHC
        </NavLink>
        
        <nav className="sidebar-nav">
          <NavLink to="/" end className={navClass}>
            Dashboard
          </NavLink>
          
          {(user.role === 'patient' || user.role === 'doctor') && (
            <>
              <NavLink to="/historial" className={navClass}>
                Historiales Clínicos
              </NavLink>
              <NavLink to="/citas" className={navClass}>
                Agenda & Citas
              </NavLink>
              <NavLink to="/chat" className={navClass}>
                Mensajes
              </NavLink>
            </>
          )}

          {user.role === 'admin' && (
            <NavLink to="/admin" className={navClass}>
              Administración
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-sm" onClick={logout}>
            <div className="avatar">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.fullName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {user.role === 'patient' ? 'Paciente' : user.role === 'doctor' ? 'Doctor' : 'Administrador'}
              </div>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', paddingRight: '0.5rem' }}>
              Salir
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)', marginRight: '0.5rem' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Buscar pacientes, historias..." />
          </div>
          <div className="topbar-actions">
            <button className="action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
            <button className="action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </button>
          </div>
        </header>
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
