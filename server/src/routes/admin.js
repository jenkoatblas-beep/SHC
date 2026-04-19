import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/users', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, email, role, full_name AS fullName, phone, active, created_at AS createdAt
     FROM users ORDER BY role, full_name`
  );
  res.json(rows);
});

router.patch('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { active } = req.body;
  if (id === req.user.id) return res.status(400).json({ error: 'No puede desactivarse a sí mismo' });
  if (typeof active !== 'boolean') return res.status(400).json({ error: 'active boolean requerido' });
  await pool.query('UPDATE users SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
  const [rows] = await pool.query(
    'SELECT id, email, role, full_name AS fullName, phone, active FROM users WHERE id = ?',
    [id]
  );
  res.json(rows[0]);
});

/** Crear usuario doctor (desde panel admin) */
router.post('/users/doctor', async (req, res) => {
  const { email, password, fullName, phone, specialty, license, bio } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, contraseña y nombre obligatorios' });
  }
  const hash = await bcrypt.hash(password, 10);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'doctor', ?, ?)`,
      [email.trim().toLowerCase(), hash, fullName.trim(), phone?.trim() || null]
    );
    const uid = r.insertId;
    await conn.query(
      `INSERT INTO doctor_profiles (user_id, specialty, professional_license, bio) VALUES (?, ?, ?, ?)`,
      [uid, specialty?.trim() || 'Psicología clínica', license?.trim() || null, bio?.trim() || null]
    );
    await conn.commit();
    res.status(201).json({ id: uid, email: email.trim().toLowerCase(), role: 'doctor', fullName: fullName.trim() });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email duplicado' });
    throw e;
  } finally {
    conn.release();
  }
});

/** Resumen para dashboard admin */
router.get('/stats', async (req, res) => {
  const [[users]] = await pool.query(
    `SELECT
       SUM(CASE WHEN role = 'patient' THEN 1 ELSE 0 END) AS patients,
       SUM(CASE WHEN role = 'doctor' THEN 1 ELSE 0 END) AS doctors,
       SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins
     FROM users WHERE active = 1`
  );
  const [[apts]] = await pool.query(
    "SELECT SUM(status='pending') AS pending, SUM(status='confirmed') AS confirmed FROM appointments"
  );
  const [[msgs]] = await pool.query('SELECT COUNT(*) AS total FROM messages');
  res.json({ users, appointments: apts, messages: msgs });
});

export default router;
