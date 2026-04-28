import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { withStore, readQueued, nextId } from '../store/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }
  const em = email.trim().toLowerCase();
  const user = await readQueued((data) => data.users.find((u) => u.email === em));
  if (!user || !user.active) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.full_name },
    process.env.JWT_SECRET || 'dev',
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, fullName: user.full_name },
  });
});

router.post('/register', async (req, res) => {
  const { email, password, fullName, phone, edad, genero } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, contraseña y nombre completo son obligatorios' });
  }
  const em = email.trim().toLowerCase();
  const hash = await bcrypt.hash(password, 10);
  try {
    const id = await withStore((data) => {
      if (data.users.some((u) => u.email === em)) {
        throw Object.assign(new Error('dup'), { code: 'DUP' });
      }
      const id = nextId(data);
      data.users.push({
        id,
        email: em,
        password_hash: hash,
        role: 'patient',
        full_name: fullName.trim(),
        phone: phone?.trim() || null,
        active: 1,
        created_at: new Date().toISOString(),
      });
      data.patient_profiles.push({
        user_id: id,
        edad: edad ? Number(edad) : null,
        genero: genero?.trim() || null,
      });
      return id;
    });
    const token = jwt.sign(
      { id, role: 'patient', name: fullName.trim() },
      process.env.JWT_SECRET || 'dev',
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: { id, email: em, role: 'patient', fullName: fullName.trim() },
    });
  } catch (e) {
    if (e.code === 'DUP') {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }
    throw e;
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const out = await readQueued((data) => {
    const u = data.users.find((x) => x.id === req.user.id);
    if (!u) return null;
    let profile = null;
    if (u.role === 'doctor') {
      const p = data.doctor_profiles.find((d) => d.user_id === u.id);
      if (p) {
        profile = { specialty: p.specialty, license: p.professional_license, bio: p.bio };
      }
    }
    return { u, profile };
  });
  if (!out) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { u, profile } = out;
  res.json({
    id: u.id,
    email: u.email,
    role: u.role,
    fullName: u.full_name,
    phone: u.phone,
    active: u.active,
    profile,
  });
});

export default router;
