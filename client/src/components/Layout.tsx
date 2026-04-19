import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

  return (
    <div className="layout">
      <header className="topbar">
        <NavLink to="/" className="brand">
          SHC<span>.</span> Teleconsulta
        </NavLink>
        <nav>
          <NavLink to="/" end className={navClass}>
            Inicio
          </NavLink>
          {(user?.role === 'patient' || user?.role === 'doctor') && (
            <>
              <NavLink to="/citas" className={navClass}>
                Citas
              </NavLink>
              <NavLink to="/historial" className={navClass}>
                Historial clínico
              </NavLink>
              <NavLink to="/chat" className={navClass}>
                Chat
              </NavLink>
            </>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navClass}>
              Administración
            </NavLink>
          )}
          {user && (
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {user.fullName} · {user.role}
            </span>
          )}
          {user && (
            <button type="button" className="btn btn-ghost" onClick={logout}>
              Salir
            </button>
          )}
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
