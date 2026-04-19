import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function parseLocalDateTime(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Citas del usuario actual (paciente o doctor) */
router.get('/mine', requireAuth, async (req, res) => {
  const uid = req.user.id;
  const role = req.user.role;
  let sql;
  let params;
  if (role === 'patient') {
    sql = `SELECT a.*,
             d.full_name AS doctorName, d.email AS doctorEmail,
             p.full_name AS patientName
           FROM appointments a
           JOIN users d ON d.id = a.doctor_id
           JOIN users p ON p.id = a.patient_id
           WHERE a.patient_id = ?
           ORDER BY a.starts_at DESC`;
    params = [uid];
  } else if (role === 'doctor') {
    sql = `SELECT a.*,
             p.full_name AS patientName, p.email AS patientEmail, p.phone AS patientPhone,
             d.full_name AS doctorName
           FROM appointments a
           JOIN users p ON p.id = a.patient_id
           JOIN users d ON d.id = a.doctor_id
           WHERE a.doctor_id = ?
           ORDER BY a.starts_at DESC`;
    params = [uid];
  } else {
    return res.status(403).json({ error: 'Solo paciente o doctor' });
  }
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

/** Paciente agenda cita */
router.post('/', requireAuth, requireRole('patient'), async (req, res) => {
  const { doctorId, startsAt, reason, durationMinutes } = req.body;
  const doctorIdNum = Number(doctorId);
  if (!doctorIdNum) return res.status(400).json({ error: 'doctorId requerido' });
  const start = parseLocalDateTime(startsAt);
  if (!start) return res.status(400).json({ error: 'Fecha/hora inválida' });

  const [[doc]] = await pool.query(
    "SELECT id FROM users WHERE id = ? AND role = 'doctor' AND active = 1",
    [doctorIdNum]
  );
  if (!doc) return res.status(404).json({ error: 'Psicólogo no encontrado' });

  const dur = Math.min(180, Math.max(15, Number(durationMinutes) || 45));

  const [r] = await pool.query(
    `INSERT INTO appointments (patient_id, doctor_id, starts_at, duration_minutes, reason, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [req.user.id, doctorIdNum, start, dur, reason?.trim() || null]
  );
  const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [r.insertId]);
  res.status(201).json(rows[0]);
});

/** Doctor actualiza estado o notas */
router.patch('/:id', requireAuth, requireRole('doctor'), async (req, res) => {
  const id = Number(req.params.id);
  const { status, notesDoctor } = req.body;
  const [[a]] = await pool.query('SELECT * FROM appointments WHERE id = ? AND doctor_id = ?', [
    id,
    req.user.id,
  ]);
  if (!a) return res.status(404).json({ error: 'Cita no encontrada' });

  const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
  const updates = [];
  const vals = [];
  if (status && allowed.includes(status)) {
    updates.push('status = ?');
    vals.push(status);
  }
  if (notesDoctor !== undefined) {
    updates.push('notes_doctor = ?');
    vals.push(notesDoctor);
  }
  if (!updates.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(id);
  await pool.query(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, vals);
  const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
  res.json(rows[0]);
});

/** Paciente cancela su cita */
router.post('/:id/cancel', requireAuth, requireRole('patient'), async (req, res) => {
  const id = Number(req.params.id);
  const [r] = await pool.query(
    "UPDATE appointments SET status = 'cancelled' WHERE id = ? AND patient_id = ? AND status IN ('pending','confirmed')",
    [id, req.user.id]
  );
  if (r.affectedRows === 0) return res.status(404).json({ error: 'No se pudo cancelar' });
  const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
  res.json(rows[0]);
});

export default router;
