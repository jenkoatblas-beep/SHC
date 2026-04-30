import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [err, setErr] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      await register({ 
        email, 
        password, 
        fullName, 
        phone: phone || undefined,
        edad: edad ? Number(edad) : undefined,
        genero: genero || undefined
      });
      nav('/');
    } catch (ex: unknown) {
      const msg =
        typeof ex === 'object' && ex !== null && 'response' in ex
          ? (ex as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setErr(msg || 'No se pudo completar el registro.');
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <div className="logo-icon" style={{ width: '40px', height: '40px', background: 'var(--accent)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em' }}>SHC</span>
          </div>

          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#1e293b', fontWeight: 800, letterSpacing: '-0.04em' }}>
            Únete a <span style={{ color: 'var(--accent)' }}>SHC</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--muted)', maxWidth: '400px', lineHeight: 1.6 }}>
            Crea tu cuenta de paciente para gestionar tus citas, acceder a tu historial médico y conectarte con profesionales de la salud.
          </p>

          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <div className="feature-text">
                <h3>Todo en un solo lugar</h3>
                <p>Tu información médica siempre disponible y segura.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon" style={{ color: 'var(--success)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              </div>
              <div className="feature-text">
                <h3>Atención inmediata</h3>
                <p>Accede a teleconsultas estés donde estés.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right" style={{ overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem' }}>Registro paciente</h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Crea tu cuenta para acceder a la plataforma</p>
        </div>

        {err && <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {err}
        </div>}

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Nombre completo</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Ej. Ana García" />
          </div>

          <div className="field">
            <label>Correo electrónico</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="ejemplo@correo.com" />
          </div>

          <div className="field">
            <label>Teléfono (opcional)</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 300 000 0000" />
          </div>

          <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label>Edad</label>
              <input className="input" type="number" min="0" value={edad} onChange={(e) => setEdad(e.target.value)} required placeholder="Años" />
            </div>
            <div>
              <label>Género</label>
              <select className="input" value={genero} onChange={(e) => setGenero(e.target.value)} required>
                <option value="">Seleccione...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="field" style={{ marginBottom: '2rem' }}>
            <label>Contraseña</label>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              type="password"
              placeholder="Min. 6 caracteres"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
            Crear cuenta
          </button>
        </form>

        <p style={{ marginTop: '2rem', marginBottom: 0, fontSize: '0.95rem', color: 'var(--muted)', textAlign: 'center' }}>
          ¿Ya tienes una cuenta? <Link to="/login" style={{ fontWeight: 600 }}>Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
}
