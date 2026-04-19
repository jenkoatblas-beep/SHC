import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../api';
import { useAuth } from '../context/AuthContext';

type Msg = {
  id: number;
  senderId: number;
  receiverId: number;
  body: string;
  createdAt: string;
};

export default function ChatRoom() {
  const { userId } = useParams();
  const peerId = Number(userId);
  const { user, token } = useAuth();
  const [peerName, setPeerName] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const meId = user?.id;

  async function loadHistory() {
    const { data } = await api.get<{ peer: { fullName: string }; messages: Msg[] }>(`/messages/with/${peerId}`);
    setPeerName(data.peer.fullName);
    setMessages(data.messages);
  }

  useEffect(() => {
    if (!peerId) return;
    loadHistory().catch(() => {});
  }, [peerId]);

  useEffect(() => {
    if (!token || !peerId) return;
    const socket = io({
      path: '/socket.io/',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    socket.on('chat:message', (msg: Msg) => {
      if (
        (msg.senderId === peerId && msg.receiverId === meId) ||
        (msg.senderId === meId && msg.receiverId === peerId)
      ) {
        setMessages((m) => [...m, msg]);
      }
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, peerId, meId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send() {
    const body = text.trim();
    if (!body || !socketRef.current) return;
    socketRef.current.emit('chat:send', { toUserId: peerId, body }, (res: { error?: string; message?: Msg }) => {
      if (res?.error) return;
      if (res?.message) setMessages((m) => [...m, res.message!]);
    });
    setText('');
  }

  const title = useMemo(() => peerName || `Usuario ${peerId}`, [peerName, peerId]);

  return (
    <div>
      <p>
        <Link to="/chat">← Conversaciones</Link>
      </p>
      <h1>{title}</h1>
      <p className="sub">Mensajes en tiempo real (WebSocket).</p>

      <div className="chat-box">
        <div className="chat-msgs">
          {messages.map((m) => {
            const mine = m.senderId === meId;
            return (
              <div key={m.id} className={`chat-bubble ${mine ? 'me' : 'them'}`}>
                {m.body}
                <div style={{ fontSize: '0.68rem', opacity: 0.75, marginTop: '0.25rem' }}>
                  {new Date(m.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-row">
          <input
            className="input"
            placeholder="Escriba un mensaje…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          />
          <button type="button" className="btn btn-primary" onClick={send}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
