import { useEffect, useState } from 'react';
import api from '../api';

type URow = {
  id: number;
  email: string;
  role: string;
  fullName: string;
  phone?: string;
  active: number;
  createdAt?: string;
};

export default function Admin() {
  const [users, setUsers] = useState<URow[]>([]);
  const [stats, setStats] = useState<{ users?: object; appointments?: object; messages?: object }>({});
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    specialty: 'Psicología clínica',
    license: '',
    bio: '',
  });

  async function refresh() {
    const [u, s] = await Promise.all([api.get<URow[]>('/admin/users'), api.get('/admin/stats')]);
    setUsers(u.data);
    setStats(s.data);
  }

  useEffect(() => {
    refresh().catch(() => setErr('Sin acceso admin.'));
  }, []);

  async function toggle(u: URow) {
    await api.patch(`/admin/users/${u.id}`, { active: !u.active });
    await refresh();
  }

  async function createDoctor(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/admin/users/doctor', form);
      setForm({ email: '', password: '', fullName: '', phone: '', specialty: 'Psicología clínica', license: '', bio: '' });
      await refresh();
    } catch (ex: unknown) {
      const msg =
        typeof ex === 'object' && ex !== null && 'response' in ex
          ? (ex as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setErr(msg || 'Error al crear psicólogo.');
    }
  }

  return (
    <div>
      <h1>Administración</h1>
      <p className="sub">Usuarios del sistema y altas de psicólogos.</p>
      {err && <div className="error-banner">{err}</div>}

      {stats.users && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Resumen</h2>
          <pre style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Nuevo psicólogo</h2>
        <form onSubmit={createDoctor}>
          <div className="grid2">
            <div className="field">
              <label>Nombre completo</label>
              <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="field">
              <label>Contraseña inicial</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="field">
              <label>Teléfono</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Especialidad</label>
              <input className="input" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </div>
            <div className="field">
              <label>Colegiatura / licencia</label>
              <input className="input" value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Bio</label>
            <textarea className="input" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary">
            Crear cuenta de psicólogo
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Usuarios</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Id</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Activo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.active ? 'Sí' : 'No'}</td>
                  <td>
                    <button type="button" className="btn btn-ghost" style={{ padding: '0.35rem 0.6rem' }} onClick={() => toggle(u)}>
                      {u.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
