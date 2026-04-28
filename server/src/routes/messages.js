import { Router } from 'express';
import { withStore, readQueued, nextId } from '../store/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/conversations', requireAuth, async (req, res) => {
  const uid = req.user.id;
  const out = await readQueued((data) => {
    const msgs = data.messages
      .filter((m) => m.sender_id === uid || m.receiver_id === uid)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 500);

    const peerMap = new Map();
    for (const m of msgs) {
      const peerId = m.sender_id === uid ? m.receiver_id : m.sender_id;
      if (!peerMap.has(peerId)) {
        peerMap.set(peerId, {
          peerId,
          lastMessage: m.body,
          lastAt: m.created_at,
          unread: 0,
        });
      }
    }
    for (const [, v] of peerMap) {
      v.unread = data.messages.filter(
        (m) => m.receiver_id === uid && m.sender_id === v.peerId && !m.read_at
      ).length;
    }
    const ids = [...peerMap.keys()];
    if (!ids.length) return [];
    const users = data.users.filter((u) => ids.includes(u.id) && u.active);
    const byId = Object.fromEntries(users.map((u) => [u.id, u]));
    return [...peerMap.values()]
      .map((v) => ({
        id: byId[v.peerId]?.id,
        fullName: byId[v.peerId]?.full_name,
        role: byId[v.peerId]?.role,
        email: byId[v.peerId]?.email,
        lastMessage: v.lastMessage,
        lastAt: v.lastAt,
        unread: v.unread,
      }))
      .filter((x) => x.id)
      .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  });
  res.json(out);
});

router.get('/with/:userId', requireAuth, async (req, res) => {
  const me = req.user.id;
  const other = Number(req.params.userId);
  if (!other || other === me) return res.status(400).json({ error: 'Usuario inválido' });

  const result = await withStore((data) => {
    const u = data.users.find((x) => x.id === other && x.active);
    if (!u) return { err: 'nf' };
    const roles = new Set([req.user.role, u.role]);
    const apt = data.appointments.some(
      (a) =>
        (a.patient_id === me && a.doctor_id === other) || (a.patient_id === other && a.doctor_id === me)
    );
    const prevMsg = data.messages.some(
      (m) =>
        (m.sender_id === me && m.receiver_id === other) || (m.sender_id === other && m.receiver_id === me)
    );
    if (req.user.role !== 'admin' && !(roles.has('patient') && roles.has('doctor') && (apt || prevMsg))) {
      return { err: 'forbidden' };
    }
    const now = new Date().toISOString();
    const rows = data.messages
      .filter(
        (m) =>
          (m.sender_id === me && m.receiver_id === other) || (m.sender_id === other && m.receiver_id === me)
      )
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((m) => {
        if (m.receiver_id === me && m.sender_id === other && !m.read_at) {
          m.read_at = now;
        }
        return {
          id: m.id,
          senderId: m.sender_id,
          receiverId: m.receiver_id,
          body: m.body,
          readAt: m.read_at,
          createdAt: m.created_at,
        };
      });
    return { peer: { id: u.id, role: u.role, fullName: u.full_name }, rows };
  });

  if (result.err === 'nf') return res.status(404).json({ error: 'Usuario no encontrado' });
  if (result.err === 'forbidden') {
    return res.status(403).json({
      error: 'Solo puede chatear con su psicólogo o paciente tras tener una cita programada',
    });
  }

  res.json({ peer: result.peer, messages: result.rows });
});

router.post('/with/:userId', requireAuth, async (req, res) => {
  const me = req.user.id;
  const other = Number(req.params.userId);
  const { body } = req.body;
  if (!other || !body?.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

  const row = await withStore((data) => {
    const u = data.users.find((x) => x.id === other && x.active);
    if (!u) return { err: 'nf' };
    const roles = new Set([req.user.role, u.role]);
    const apt = data.appointments.some(
      (a) =>
        (a.patient_id === me && a.doctor_id === other) || (a.patient_id === other && a.doctor_id === me)
    );
    const prevMsg = data.messages.some(
      (m) =>
        (m.sender_id === me && m.receiver_id === other) || (m.sender_id === other && m.receiver_id === me)
    );
    if (req.user.role !== 'admin' && !(roles.has('patient') && roles.has('doctor') && (apt || prevMsg))) {
      return { err: 'forbidden' };
    }
    const id = nextId(data);
    const msg = {
      id,
      sender_id: me,
      receiver_id: other,
      body: body.trim().slice(0, 8000),
      read_at: null,
      created_at: new Date().toISOString(),
    };
    data.messages.push(msg);
    return {
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      body: msg.body,
      createdAt: msg.created_at,
    };
  });

  if (row?.err === 'nf') return res.status(404).json({ error: 'Usuario no encontrado' });
  if (row?.err === 'forbidden') {
    return res.status(403).json({ error: 'Debe existir una cita con este usuario para usar el chat' });
  }
  res.status(201).json(row);
});

export default router;
