import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** Conversaciones recientes (agrupado en servidor) */
router.get('/conversations', requireAuth, async (req, res) => {
  const uid = req.user.id;
  const [msgs] = await pool.query(
    `SELECT id, sender_id AS senderId, receiver_id AS receiverId, body, read_at AS readAt, created_at AS createdAt
     FROM messages
     WHERE sender_id = ? OR receiver_id = ?
     ORDER BY created_at DESC
     LIMIT 500`,
    [uid, uid]
  );

  const peerMap = new Map();
  for (const m of msgs) {
    const peerId = m.senderId === uid ? m.receiverId : m.senderId;
    if (!peerMap.has(peerId)) {
      peerMap.set(peerId, {
        peerId,
        lastMessage: m.body,
        lastAt: m.createdAt,
        unread: 0,
      });
    }
  }

  for (const [, v] of peerMap) {
    const [c] = await pool.query(
      'SELECT COUNT(*) AS n FROM messages WHERE receiver_id = ? AND sender_id = ? AND read_at IS NULL',
      [uid, v.peerId]
    );
    v.unread = Number(c[0]?.n || 0);
  }

  const ids = [...peerMap.keys()];
  if (!ids.length) return res.json([]);

  const [users] = await pool.query(
    `SELECT id, full_name AS fullName, role, email FROM users WHERE id IN (${ids.map(() => '?').join(',')}) AND active = 1`,
    ids
  );
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  const out = [...peerMap.values()]
    .map((v) => ({ ...byId[v.peerId], lastMessage: v.lastMessage, lastAt: v.lastAt, unread: v.unread }))
    .filter((x) => x.id);
  out.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  res.json(out);
});

router.get('/with/:userId', requireAuth, async (req, res) => {
  const me = req.user.id;
  const other = Number(req.params.userId);
  if (!other || other === me) return res.status(400).json({ error: 'Usuario inválido' });

  const [[u]] = await pool.query('SELECT id, role, full_name AS fullName FROM users WHERE id = ? AND active = 1', [
    other,
  ]);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });

  const roles = new Set([req.user.role, u.role]);
  const [apt] = await pool.query(
    `SELECT 1 FROM appointments
     WHERE (patient_id = ? AND doctor_id = ?) OR (patient_id = ? AND doctor_id = ?)
     LIMIT 1`,
    [me, other, other, me]
  );
  const [prevMsg] = await pool.query(
    `SELECT 1 FROM messages
     WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
     LIMIT 1`,
    [me, other, other, me]
  );

  if (
    req.user.role !== 'admin' &&
    !(roles.has('patient') && roles.has('doctor') && (apt.length || prevMsg.length))
  ) {
    return res.status(403).json({
      error: 'Solo puede chatear con su psicólogo o paciente tras tener una cita programada',
    });
  }

  const [rows] = await pool.query(
    `SELECT id, sender_id AS senderId, receiver_id AS receiverId, body, read_at AS readAt, created_at AS createdAt
     FROM messages
     WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
     ORDER BY created_at ASC`,
    [me, other, other, me]
  );

  await pool.query(
    'UPDATE messages SET read_at = NOW() WHERE receiver_id = ? AND sender_id = ? AND read_at IS NULL',
    [me, other]
  );

  res.json({ peer: u, messages: rows });
});

router.post('/with/:userId', requireAuth, async (req, res) => {
  const me = req.user.id;
  const other = Number(req.params.userId);
  const { body } = req.body;
  if (!other || !body?.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

  const [[u]] = await pool.query('SELECT id, role FROM users WHERE id = ? AND active = 1', [other]);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });

  const roles = new Set([req.user.role, u.role]);
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
    req.user.role !== 'admin' &&
    !(roles.has('patient') && roles.has('doctor') && (apt.length || prevMsg.length))
  ) {
    return res.status(403).json({ error: 'Debe existir una cita con este usuario para usar el chat' });
  }

  const [r] = await pool.query(
    'INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)',
    [me, other, body.trim().slice(0, 8000)]
  );
  const [rows] = await pool.query(
    'SELECT id, sender_id AS senderId, receiver_id AS receiverId, body, created_at AS createdAt FROM messages WHERE id = ?',
    [r.insertId]
  );
  res.status(201).json(rows[0]);
});

export default router;
