import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../context/AuthContext';

export default function Protected({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ color: 'var(--muted)' }}>Cargando…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
