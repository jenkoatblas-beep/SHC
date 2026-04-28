import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

type RecordRow = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

type PatientInfo = {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  edad?: number;
  genero?: string;
};

type ApiResponse = {
  patient: PatientInfo;
  records: RecordRow[];
};

export default function HistorialPaciente() {
  const { patientId } = useParams();
  const pid = Number(patientId);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [title, setTitle] = useState('Consulta');
  const [content, setContent] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    const { data } = await api.get<ApiResponse>(`/records/patient/${pid}`);
    setPatient(data.patient);
    setRows(data.records);
  }

  useEffect(() => {
    if (!pid) return;
    load().catch(() => setErr('No autorizado o paciente inexistente.'));
  }, [pid]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/records', { patientId: pid, title, content });
      setContent('');
      await load();
    } catch {
      setErr('No se pudo guardar la nota.');
    }
  }

  return (
    <div>
      <p style={{ marginBottom: '1rem' }}>
        <Link to="/historial" style={{ textDecoration: 'none', color: 'var(--primary)' }}>
          ← Volver a pacientes
        </Link>
      </p>

      {err && <div className="error-banner">{err}</div>}

      {patient && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary)', background: 'linear-gradient(to right, rgba(14,165,233,0.05), transparent)' }}>
          <h1 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.5rem', color: 'var(--text)' }}>
            {patient.fullName}
          </h1>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--muted)' }}>
            {patient.edad && (
              <div>
                <strong style={{ color: 'var(--text)' }}>Edad:</strong> {patient.edad} años
              </div>
            )}
            {patient.genero && (
              <div>
                <strong style={{ color: 'var(--text)' }}>Género:</strong> {patient.genero}
              </div>
            )}
            <div>
              <strong style={{ color: 'var(--text)' }}>Email:</strong> {patient.email}
            </div>
            {patient.phone && (
              <div>
                <strong style={{ color: 'var(--text)' }}>Teléfono:</strong> {patient.phone}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Nueva entrada clínica</h2>
          <form onSubmit={add}>
            <div className="field">
              <label>Título</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="field">
              <label>Contenido</label>
              <textarea className="input" rows={4} value={content} onChange={(e) => setContent(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary">
              Guardar en historial
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Registros anteriores</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rows.map((r) => (
              <article key={r.id} style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 0.35rem', color: 'var(--primary)' }}>{r.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 0.75rem' }}>
                  {new Date(r.created_at).toLocaleString('es')}
                </p>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{r.content}</p>
              </article>
            ))}
            {!rows.length && <p style={{ color: 'var(--muted)' }}>Sin registros todavía.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
