import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Historias clínicas y teleconsulta psicológica</h1>
      <p className="sub">
        Plataforma para pacientes, psicólogos y administración: citas en línea, historial clínico compartido y chat
        privado entre paciente y su profesional.
      </p>

      {!user && (
        <div className="card" style={{ maxWidth: 520 }}>
          <p style={{ marginTop: 0 }}>
            <Link to="/login">Iniciar sesión</Link> o <Link to="/registro">registrarse como paciente</Link>.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 0 }}>
            Tras ejecutar <code>npm run seed</code> en el servidor, puede probar:{' '}
            <strong>admin@shc.local</strong>, <strong>doctora@shc.local</strong>, <strong>paciente@shc.local</strong> —
            contraseña <strong>demo123</strong>.
          </p>
        </div>
      )}

      {user?.role === 'patient' && (
        <div className="grid2">
          <Link to="/citas" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Mis citas</h2>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Programar o revisar citas con su psicólogo.</p>
          </Link>
          <Link to="/historial" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Historial clínico</h2>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Notas de consulta visibles para usted.</p>
          </Link>
          <Link to="/chat" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Chat</h2>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Mensajes con su psicólogo (tras tener una cita).</p>
          </Link>
        </div>
      )}

      {user?.role === 'doctor' && (
        <div className="grid2">
          <Link to="/citas" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Agenda</h2>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Citas solicitadas y confirmadas.</p>
          </Link>
          <Link to="/historial" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Pacientes e historial</h2>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Revisar y documentar historias clínicas.</p>
          </Link>
          <Link to="/chat" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Chat</h2>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Conversación privada con pacientes.</p>
          </Link>
        </div>
      )}

      {user?.role === 'admin' && (
        <Link to="/admin" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block', maxWidth: 400 }}>
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Panel de administración</h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Usuarios, altas de psicólogos y estadísticas.</p>
        </Link>
      )}
    </div>
  );
}
