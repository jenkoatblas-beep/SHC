import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '4rem', marginTop: '2rem' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: '#1e293b', lineHeight: 1.2 }}>
            Tu salud, <span style={{ color: 'var(--accent)' }}>nuestra prioridad</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--muted)', margin: '0 auto 2.5rem', lineHeight: 1.6, maxWidth: '600px' }}>
            Gestiona tu historia clínica de forma segura y accede a teleconsultas con profesionales de la salud en cualquier momento y lugar.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', fontSize: '1.05rem', borderRadius: '30px' }}>Iniciar sesión</Link>
            <Link to="/registro" className="btn btn-ghost" style={{ padding: '0.85rem 2.5rem', fontSize: '1.05rem', borderRadius: '30px', border: '1px solid #cbd5e1' }}>Registrarse</Link>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto 4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>¿Qué puedes hacer?</div>
          <div className="grid3" style={{ textAlign: 'left' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div className="feature-icon" style={{ marginBottom: '1.5rem', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>Historial Clínico</h3>
              <p className="sub" style={{ margin: 0, fontSize: '0.95rem' }}>Accede y administra tu información médica de manera segura y confidencial.</p>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div className="feature-icon" style={{ marginBottom: '1.5rem', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              </div>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>Teleconsultas</h3>
              <p className="sub" style={{ margin: 0, fontSize: '0.95rem' }}>Conéctate con médicos desde la comodidad de tu hogar a través de video.</p>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div className="feature-icon" style={{ marginBottom: '1.5rem', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>Documentos</h3>
              <p className="sub" style={{ margin: 0, fontSize: '0.95rem' }}>Guarda y comparte exámenes, recetas y otros documentos con tu doctor.</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          Plataforma segura y confiable
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      <div>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1>¡Hola, {user.role === 'doctor' ? 'Dr. ' : ''}{user.fullName}! 👋</h1>
          <p className="sub" style={{ margin: 0 }}>Bienvenido a tu sistema de gestión clínica</p>
        </div>

        <div className="grid2" style={{ marginBottom: '2.5rem' }}>
          <Link to="/citas" className="stat-card" style={{ textDecoration: 'none', transition: 'transform 0.2s' }}>
            <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div className="stat-content">
              <h4>Agenda</h4>
              <p>Ver mis citas</p>
            </div>
          </Link>
          
          <Link to="/historial" className="stat-card" style={{ textDecoration: 'none', transition: 'transform 0.2s' }}>
            <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div className="stat-content">
              <h4>{user.role === 'patient' ? 'Mi Historial' : 'Pacientes'}</h4>
              <p>Gestionar historias clínicas</p>
            </div>
          </Link>

          <Link to="/chat" className="stat-card" style={{ textDecoration: 'none', transition: 'transform 0.2s' }}>
            <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div className="stat-content">
              <h4>Mensajes</h4>
              <p>Chat privado</p>
            </div>
          </Link>
          
          {user.role === 'admin' && (
            <Link to="/admin" className="stat-card" style={{ textDecoration: 'none', transition: 'transform 0.2s' }}>
              <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </div>
              <div className="stat-content">
                <h4>Administración</h4>
                <p>Panel de control</p>
              </div>
            </Link>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Actividad Reciente</h3>
            <Link to="/historial" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Ver toda la actividad</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>Sesión iniciada correctamente</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Hoy</div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Ahora</div>
            </div>
            
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>Sistema actualizado</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Nuevas funciones disponibles</div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Hace 2 días</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Próximas Citas</h3>
            <Link to="/citas" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Ver agenda</Link>
          </div>
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--muted)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#cbd5e1' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            No hay citas programadas para hoy.
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/citas" className="btn btn-ghost">Programar cita</Link>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 4px 10px rgba(37,99,235,0.1)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Iniciar Teleconsulta</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              Inicia una teleconsulta al instante o invita a un paciente a unirse mediante un código.
            </p>
            <a href="https://teams.microsoft.com/v2/" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', width: '100%', marginBottom: '0.75rem', background: 'var(--success)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              Nueva Teleconsulta
            </a>
            <button className="btn btn-ghost" style={{ width: '100%', background: 'white' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Unirse con Código
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
