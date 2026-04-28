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
    <div className="auth-page">
      <div className="card auth-card">
        <h1 style={{ marginTop: 0 }}>Registro paciente</h1>
        <p className="sub" style={{ marginTop: '-0.25rem' }}>
          Los perfiles de psicólogo los crea un administrador.
        </p>
        {err && <div className="error-banner">{err}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Nombre completo</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
          </div>
          <div className="field">
            <label>Teléfono (opcional)</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label>Edad</label>
              <input className="input" type="number" min="0" value={edad} onChange={(e) => setEdad(e.target.value)} required />
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
          <div className="field">
            <label>Contraseña</label>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              type="password"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Crear cuenta
          </button>
        </form>
        <p style={{ marginTop: '1.25rem', marginBottom: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>
          <Link to="/login">Volver al login</Link>
        </p>
      </div>
    </div>
  );
}
