import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

type Conv = {
  id: number;
  fullName: string;
  role: string;
  email: string;
  lastMessage?: string;
  lastAt?: string;
  unread?: number;
};

export default function ChatList() {
  const [list, setList] = useState<Conv[]>([]);

  useEffect(() => {
    api.get<Conv[]>('/messages/conversations').then(({ data }) => setList(data));
  }, []);

  return (
    <div>
      <h1>Conversaciones</h1>
      <p className="sub">Chat privado con su psicólogo o paciente (requiere haber programado al menos una cita).</p>
      <div className="card" style={{ padding: 0 }}>
        {list.map((c) => (
          <Link
            key={c.id}
            to={`/chat/${c.id}`}
            style={{
              display: 'block',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
              <strong>{c.fullName}</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c.role}</span>
            </div>
            {c.lastMessage && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.lastMessage}
              </p>
            )}
            <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
              {c.lastAt && new Date(c.lastAt).toLocaleString('es')}
              {c.unread ? <span style={{ color: 'var(--accent)', marginLeft: '0.5rem' }}>({c.unread} sin leer)</span> : null}
            </div>
          </Link>
        ))}
        {!list.length && <p style={{ padding: '1.25rem', color: 'var(--muted)' }}>Aún no hay conversaciones. Programe una cita primero.</p>}
      </div>
    </div>
  );
}
