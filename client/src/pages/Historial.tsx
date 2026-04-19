import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

type RecordRow = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  doctorName: string;
};

type PatientRow = {
  patientId: number;
  patientName: string;
  email: string;
  phone?: string;
};

export default function Historial() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role === 'patient') {
      api
        .get<RecordRow[]>('/records/mine')
        .then(({ data }) => setRecords(data))
        .catch(() => setErr('No se pudo cargar el historial.'));
    } else if (user.role === 'doctor') {
      api
        .get<{ patients: PatientRow[] }>('/records/mine')
        .then(({ data }) => setPatients(data.patients || []))
        .catch(() => setErr('No se pudo cargar la lista de pacientes.'));
    }
  }, [user]);

  return (
    <div>
      <h1>Historial clínico</h1>
      <p className="sub">
        {user?.role === 'patient' && 'Consultas registradas por su psicólogo (solo lectura).'}
        {user?.role === 'doctor' && 'Pacientes con los que tiene cita o notas previas.'}
      </p>
      {err && <div className="error-banner">{err}</div>}

      {user?.role === 'patient' && (
        <div className="card">
          {records.map((r) => (
            <article key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 0.35rem' }}>{r.title}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 0.5rem' }}>
                {new Date(r.createdAt).toLocaleString('es')} · {r.doctorName}
              </p>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{r.content}</p>
            </article>
          ))}
          {!records.length && <p style={{ color: 'var(--muted)' }}>Aún no hay notas en su historial.</p>}
        </div>
      )}

      {user?.role === 'doctor' && (
        <div className="table-wrap card">
          <table className="data">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Contacto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.patientId}>
                  <td>{p.patientName}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {p.email} {p.phone || ''}
                  </td>
                  <td>
                    <Link to={`/historial/paciente/${p.patientId}`}>Abrir historial</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!patients.length && <p style={{ padding: '1rem', color: 'var(--muted)' }}>Sin pacientes asociados aún.</p>}
        </div>
      )}
    </div>
  );
}
