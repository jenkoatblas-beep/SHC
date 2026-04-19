import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

type RecordRow = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default function HistorialPaciente() {
  const { patientId } = useParams();
  const pid = Number(patientId);
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [title, setTitle] = useState('Consulta');
  const [content, setContent] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    const { data } = await api.get<RecordRow[]>(`/records/patient/${pid}`);
    setRows(data);
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
      <p>
        <Link to="/historial">← Volver a pacientes</Link>
      </p>
      <h1>Historial del paciente #{pid}</h1>
      <p className="sub">Añada entradas clínicas; el paciente podrá leerlas en su panel.</p>
      {err && <div className="error-banner">{err}</div>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Nueva entrada</h2>
        <form onSubmit={add}>
          <div className="field">
            <label>Título</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="field">
            <label>Contenido</label>
            <textarea className="input" rows={5} value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">
            Guardar en historial
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Registros anteriores</h2>
        {rows.map((r) => (
          <article key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', margin: '0 0 0.35rem' }}>{r.title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 0.5rem' }}>
              {new Date(r.created_at).toLocaleString('es')}
            </p>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{r.content}</p>
          </article>
        ))}
        {!rows.length && <p style={{ color: 'var(--muted)' }}>Sin registros todavía.</p>}
      </div>
    </div>
  );
}
