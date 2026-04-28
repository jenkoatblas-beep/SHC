import http from 'http';
import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { withStore, nextId } from './store/index.js';
import authRoutes from './routes/auth.js';
import doctorsRoutes from './routes/doctors.js';
import appointmentsRoutes from './routes/appointments.js';
import recordsRoutes from './routes/records.js';
import messagesRoutes from './routes/messages.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  try {
    const mode = (process.env.STORAGE_MODE || 'json').toLowerCase();
    res.json({ ok: true, database: mode });
  } catch (e) {
    res.status(503).json({ ok: false, database: 'error', message: e.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('[API]', err.code || '', err.message);
  res.status(500).json({ error: err.message || 'Error interno', code: err.code });
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Sin token'));
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    socket.userId = payload.id;
    socket.userRole = payload.role;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  const room = `user:${socket.userId}`;
  socket.join(room);

  socket.on('chat:send', async ({ toUserId, body }, cb) => {
    try {
      const me = socket.userId;
      const other = Number(toUserId);
      if (!other || !body?.trim()) {
        cb?.({ error: 'Datos inválidos' });
        return;
      }
      const msg = await withStore((data) => {
        const u = data.users.find((x) => x.id === other && x.active);
        if (!u) return { err: 'nf' };
        const roles = new Set([socket.userRole, u.role]);
        const apt = data.appointments.some(
          (a) =>
            (a.patient_id === me && a.doctor_id === other) || (a.patient_id === other && a.doctor_id === me)
        );
        const prevMsg = data.messages.some(
          (m) =>
            (m.sender_id === me && m.receiver_id === other) || (m.sender_id === other && m.receiver_id === me)
        );
        if (
          socket.userRole !== 'admin' &&
          !(roles.has('patient') && roles.has('doctor') && (apt || prevMsg))
        ) {
          return { err: 'deny' };
        }
        const id = nextId(data);
        const row = {
          id,
          sender_id: me,
          receiver_id: other,
          body: String(body).trim().slice(0, 8000),
          read_at: null,
          created_at: new Date().toISOString(),
        };
        data.messages.push(row);
        return {
          id: row.id,
          senderId: row.sender_id,
          receiverId: row.receiver_id,
          body: row.body,
          createdAt: row.created_at,
        };
      });
      if (msg?.err === 'nf') {
        cb?.({ error: 'Usuario no encontrado' });
        return;
      }
      if (msg?.err === 'deny') {
        cb?.({ error: 'No permitido' });
        return;
      }
      io.to(`user:${other}`).emit('chat:message', msg);
      cb?.({ ok: true, message: msg });
    } catch (e) {
      console.error(e);
      cb?.({ error: 'Error al enviar' });
    }
  });
});

const PORT = Number(process.env.PORT || 4000);
const MODE = (process.env.STORAGE_MODE || 'json').toUpperCase();
server.listen(PORT, () => {
  console.log(`SHC API + WebSocket [${MODE}] en http://localhost:${PORT}`);
});
