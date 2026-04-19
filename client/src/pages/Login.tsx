import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      await login(email, password);
      nav('/');
    } catch {
      setErr('Credenciales incorrectas o cuenta desactivada.');
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 style={{ marginTop: 0 }}>Iniciar sesión</h1>
        <p className="sub" style={{ marginTop: '-0.25rem' }}>
          Pacientes, psicólogos o administrador
        </p>
        {err && <div className="error-banner">{err}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Entrar
          </button>
        </form>
        <p style={{ marginTop: '1.25rem', marginBottom: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>
          ¿No tiene cuenta? <Link to="/registro">Registro paciente</Link>
        </p>
      </div>
    </div>
  );
}
