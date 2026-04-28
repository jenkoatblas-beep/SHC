import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { withStore, readQueued, nextId } from '../store/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/users', async (req, res) => {
  const rows = await readQueued((data) =>
    [...data.users]
      .sort((a, b) => String(a.role).localeCompare(b.role) || String(a.full_name).localeCompare(b.full_name))
      .map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        fullName: u.full_name,
        phone: u.phone,
        active: u.active,
        createdAt: u.created_at,
      }))
  );
  res.json(rows);
});

router.patch('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { active } = req.body;
  if (id === req.user.id) return res.status(400).json({ error: 'No puede desactivarse a sí mismo' });
  if (typeof active !== 'boolean') return res.status(400).json({ error: 'active boolean requerido' });
  const row = await withStore((data) => {
    const u = data.users.find((x) => x.id === id);
    if (!u) return null;
    u.active = active ? 1 : 0;
    return u;
  });
  if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({
    id: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
    phone: row.phone,
    active: row.active,
  });
});

router.post('/users/doctor', async (req, res) => {
  const { email, password, fullName, phone, specialty, license, bio } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, contraseña y nombre obligatorios' });
  }
  const em = email.trim().toLowerCase();
  const hash = await bcrypt.hash(password, 10);
  try {
    const uid = await withStore((data) => {
      if (data.users.some((u) => u.email === em)) {
        throw Object.assign(new Error('dup'), { code: 'DUP' });
      }
      const id = nextId(data);
      data.users.push({
        id,
        email: em,
        password_hash: hash,
        role: 'doctor',
        full_name: fullName.trim(),
        phone: phone?.trim() || null,
        active: 1,
        created_at: new Date().toISOString(),
      });
      data.doctor_profiles.push({
        user_id: id,
        specialty: specialty?.trim() || 'Psicología clínica',
        professional_license: license?.trim() || null,
        bio: bio?.trim() || null,
      });
      return id;
    });
    res.status(201).json({ id: uid, email: em, role: 'doctor', fullName: fullName.trim() });
  } catch (e) {
    if (e.code === 'DUP') return res.status(409).json({ error: 'Email duplicado' });
    throw e;
  }
});

router.get('/stats', async (req, res) => {
  const stats = await readQueued((data) => {
    const users = data.users.filter((u) => u.active);
    const patients = users.filter((u) => u.role === 'patient').length;
    const doctors = users.filter((u) => u.role === 'doctor').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const pending = data.appointments.filter((a) => a.status === 'pending').length;
    const confirmed = data.appointments.filter((a) => a.status === 'confirmed').length;
    return {
      users: { patients, doctors, admins },
      appointments: { pending, confirmed },
      messages: { total: data.messages.length },
    };
  });
  res.json(stats);
});

export default router;
