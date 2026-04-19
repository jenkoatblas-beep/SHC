import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }
  const [rows] = await pool.query(
    'SELECT id, email, password_hash, role, full_name, active FROM users WHERE email = ?',
    [email.trim().toLowerCase()]
  );
  const user = rows[0];
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
  const { email, password, fullName, phone } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, contraseña y nombre completo son obligatorios' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const [r] = await pool.query(
      `INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'patient', ?, ?)`,
      [email.trim().toLowerCase(), hash, fullName.trim(), phone?.trim() || null]
    );
    const id = r.insertId;
    const token = jwt.sign(
      { id, role: 'patient', name: fullName.trim() },
      process.env.JWT_SECRET || 'dev',
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: { id, email: email.trim().toLowerCase(), role: 'patient', fullName: fullName.trim() },
    });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }
    throw e;
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, email, role, full_name AS fullName, phone, active FROM users WHERE id = ?',
    [req.user.id]
  );
  const u = rows[0];
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
  let profile = null;
  if (u.role === 'doctor') {
    const [p] = await pool.query(
      'SELECT specialty, professional_license AS license, bio FROM doctor_profiles WHERE user_id = ?',
      [u.id]
    );
    profile = p[0] || null;
  }
  res.json({ ...u, profile });
});

export default router;
