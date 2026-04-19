import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

type Apt = {
  id: number;
  patient_id?: number;
  doctor_id?: number;
  starts_at: string;
  duration_minutes: number;
  status: string;
  reason?: string;
  notes_doctor?: string;
  doctorName?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
};

type Doctor = {
  id: number;
  fullName: string;
  specialty: string;
  email: string;
};

function statusBadge(s: string) {
  const map: Record<string, string> = {
    pending: 'badge badge-pending',
    confirmed: 'badge badge-confirmed',
    completed: 'badge badge-completed',
    cancelled: 'badge badge-cancelled',
  };
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };
  return <span className={map[s] || 'badge'}>{labels[s] || s}</span>;
}

export default function Citas() {
  const { user } = useAuth();
  const [list, setList] = useState<Apt[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    const { data } = await api.get<Apt[]>('/appointments/mine');
    setList(data);
  }

  useEffect(() => {
    load().catch(() => setErr('No se pudieron cargar las citas.'));
  }, []);

  useEffect(() => {
    if (user?.role !== 'patient') return;
    api
      .get<Doctor[]>('/doctors')
      .then(({ data }) => {
        setDoctors(data);
        if (data[0]) setDoctorId(String(data[0].id));
      })
      .catch(() => {});
  }, [user?.role]);

  async function schedule(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/appointments', {
        doctorId: Number(doctorId),
        startsAt: new Date(startsAt).toISOString(),
        reason,
      });
      setReason('');
      await load();
    } catch {
      setErr('No se pudo crear la cita. Revise fecha y psicólogo.');
    }
  }

  async function setStatus(id: number, status: string) {
    await api.patch(`/appointments/${id}`, { status });
    await load();
  }

  async function saveNotes(id: number, notesDoctor: string) {
    await api.patch(`/appointments/${id}`, { notesDoctor });
    await load();
  }

  async function cancel(id: number) {
    await api.post(`/appointments/${id}/cancel`);
    await load();
  }

  return (
    <div>
      <h1>Citas</h1>
      <p className="sub">
        {user?.role === 'patient' && 'Programe una teleconsulta con el psicólogo que elija.'}
        {user?.role === 'doctor' && 'Revise las citas solicitadas y actualice el estado.'}
      </p>
      {err && <div className="error-banner">{err}</div>}

      {user?.role === 'patient' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Nueva cita</h2>
          <form onSubmit={schedule}>
            <div className="grid2">
              <div className="field">
                <label>Psicólogo</label>
                <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} — {d.specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Fecha y hora</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label>Motivo / comentario (opcional)</label>
              <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">
              Solicitar cita
            </button>
          </form>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 0, marginTop: '1rem' }}>
            Tras la solicitud podrá usar el <Link to="/chat">chat</Link> con ese profesional.
          </p>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{user?.role === 'patient' ? 'Mis citas' : 'Citas programadas'}</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Duración</th>
                <th>Estado</th>
                {user?.role === 'patient' ? <th>Psicólogo</th> : <th>Paciente</th>}
                <th>Detalle</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.starts_at).toLocaleString('es')}</td>
                  <td>{a.duration_minutes} min</td>
                  <td>{statusBadge(a.status)}</td>
                  <td>{user?.role === 'patient' ? a.doctorName : a.patientName}</td>
                  <td style={{ maxWidth: 220, fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {a.reason || '—'}
                    {user?.role === 'doctor' && a.patientEmail && (
                      <div>
                        {a.patientEmail} {a.patientPhone}
                      </div>
                    )}
                  </td>
                  <td>
                    {user?.role === 'doctor' && a.patient_id && (
                      <div style={{ marginBottom: '0.35rem' }}>
                        <Link to={`/chat/${a.patient_id}`}>Abrir chat</Link>
                      </div>
                    )}
                    {user?.role === 'doctor' && a.status !== 'cancelled' && a.status !== 'completed' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {a.status === 'pending' && (
                          <button type="button" className="btn btn-ghost" style={{ padding: '0.35rem 0.6rem' }} onClick={() => setStatus(a.id, 'confirmed')}>
                            Confirmar
                          </button>
                        )}
                        <button type="button" className="btn btn-ghost" style={{ padding: '0.35rem 0.6rem' }} onClick={() => setStatus(a.id, 'completed')}>
                          Completar
                        </button>
                        <button type="button" className="btn btn-danger" style={{ padding: '0.35rem 0.6rem' }} onClick={() => setStatus(a.id, 'cancelled')}>
                          Cancelar
                        </button>
                      </div>
                    )}
                    {user?.role === 'patient' && a.doctor_id && (a.status === 'pending' || a.status === 'confirmed') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                        <Link to={`/chat/${a.doctor_id}`}>Chat con psicólogo</Link>
                        <button type="button" className="btn btn-danger" style={{ padding: '0.35rem 0.6rem' }} onClick={() => cancel(a.id)}>
                          Cancelar mi cita
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <p style={{ color: 'var(--muted)' }}>No hay citas todavía.</p>}
        </div>

        {user?.role === 'doctor' && list.length > 0 && (
          <DoctorNotes list={list} onSave={saveNotes} />
        )}
      </div>
    </div>
  );
}

function DoctorNotes({ list, onSave }: { list: Apt[]; onSave: (id: number, n: string) => void }) {
  const [draft, setDraft] = useState<Record<number, string>>({});
  return (
    <div style={{ marginTop: '1.25rem' }}>
      <h3 style={{ fontSize: '1rem' }}>Notas internas por cita</h3>
      {list.map((a) => (
        <div key={a.id} className="field" style={{ marginBottom: '0.75rem' }}>
          <label>
            #{a.id} — {a.patientName}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="input"
              placeholder="Notas del profesional"
              defaultValue={a.notes_doctor || ''}
              onChange={(e) => setDraft((d) => ({ ...d, [a.id]: e.target.value }))}
            />
            <button type="button" className="btn btn-ghost" onClick={() => onSave(a.id, draft[a.id] ?? a.notes_doctor ?? '')}>
              Guardar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
