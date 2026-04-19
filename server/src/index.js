import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import pool from './db.js';
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

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/admin', adminRoutes);

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
      const [[u]] = await pool.query('SELECT id, role FROM users WHERE id = ? AND active = 1', [other]);
      if (!u) {
        cb?.({ error: 'Usuario no encontrado' });
        return;
      }
      const roles = new Set([socket.userRole, u.role]);
      const [apt] = await pool.query(
        `SELECT 1 FROM appointments
         WHERE (patient_id = ? AND doctor_id = ?) OR (patient_id = ? AND doctor_id = ?) LIMIT 1`,
        [me, other, other, me]
      );
      const [prevMsg] = await pool.query(
        `SELECT 1 FROM messages
         WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) LIMIT 1`,
        [me, other, other, me]
      );
      if (
        socket.userRole !== 'admin' &&
        !(roles.has('patient') && roles.has('doctor') && (apt.length || prevMsg.length))
      ) {
        cb?.({ error: 'No permitido' });
        return;
      }
      const [r] = await pool.query(
        'INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)',
        [me, other, String(body).trim().slice(0, 8000)]
      );
      const [rows] = await pool.query(
        'SELECT id, sender_id AS senderId, receiver_id AS receiverId, body, created_at AS createdAt FROM messages WHERE id = ?',
        [r.insertId]
      );
      const msg = rows[0];
      io.to(`user:${other}`).emit('chat:message', msg);
      cb?.({ ok: true, message: msg });
    } catch (e) {
      console.error(e);
      cb?.({ error: 'Error al enviar' });
    }
  });
});

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => {
  console.log(`SHC API + WebSocket en http://localhost:${PORT}`);
});
