import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

/** Historial clínico visible para paciente (suyo) o doctor (de sus pacientes con los que ha tenido cita o nota) */
router.get('/mine', requireAuth, async (req, res) => {
  const uid = req.user.id;
  const role = req.user.role;

  if (role === 'patient') {
    const [rows] = await pool.query(
      `SELECT r.id, r.title, r.content, r.created_at AS createdAt,
              r.doctor_id AS doctorId, u.full_name AS doctorName,
              r.appointment_id AS appointmentId
       FROM clinical_records r
       JOIN users u ON u.id = r.doctor_id
       WHERE r.patient_id = ?
       ORDER BY r.created_at DESC`,
      [uid]
    );
    return res.json(rows);
  }

  if (role === 'doctor') {
    const [rows] = await pool.query(
      `SELECT DISTINCT u.id AS patientId, u.full_name AS patientName, u.email, u.phone
       FROM users u
       WHERE u.role = 'patient' AND u.active = 1
         AND (
           EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = u.id AND a.doctor_id = ?)
           OR EXISTS (SELECT 1 FROM clinical_records cr WHERE cr.patient_id = u.id AND cr.doctor_id = ?)
         )
       ORDER BY u.full_name`,
      [uid, uid]
    );
    return res.json({ patients: rows });
  }

  return res.status(403).json({ error: 'Solo paciente o doctor' });
});

/** Notas clínicas de un paciente (solo doctor asignado por relación) */
router.get('/patient/:patientId', requireAuth, requireRole('doctor'), async (req, res) => {
  const patientId = Number(req.params.patientId);
  const [relRows] = await pool.query(
    `(SELECT 1 AS x FROM appointments WHERE patient_id = ? AND doctor_id = ? LIMIT 1)
     UNION ALL
     (SELECT 1 AS x FROM clinical_records WHERE patient_id = ? AND doctor_id = ? LIMIT 1)
     LIMIT 1`,
    [patientId, req.user.id, patientId, req.user.id]
  );
  if (!relRows.length) {
    return res.status(403).json({ error: 'No tiene relación clínica con este paciente' });
  }
  const [rows] = await pool.query(
    `SELECT r.*, r.created_at AS createdAt
     FROM clinical_records r WHERE r.patient_id = ? AND r.doctor_id = ?
     ORDER BY r.created_at DESC`,
    [patientId, req.user.id]
  );
  res.json(rows);
});

/** Crear nota clínica (doctor) */
router.post('/', requireAuth, requireRole('doctor'), async (req, res) => {
  const { patientId, title, content, appointmentId } = req.body;
  const pid = Number(patientId);
  if (!pid || !content?.trim()) {
    return res.status(400).json({ error: 'patientId y contenido son obligatorios' });
  }
  const [[p]] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'patient'", [pid]);
  if (!p) return res.status(404).json({ error: 'Paciente no encontrado' });

  let aptId = appointmentId ? Number(appointmentId) : null;
  if (aptId) {
    const [[a]] = await pool.query(
      'SELECT id FROM appointments WHERE id = ? AND patient_id = ? AND doctor_id = ?',
      [aptId, pid, req.user.id]
    );
    if (!a) aptId = null;
  }

  const [r] = await pool.query(
    `INSERT INTO clinical_records (patient_id, doctor_id, appointment_id, title, content)
     VALUES (?, ?, ?, ?, ?)`,
    [pid, req.user.id, aptId, (title || 'Consulta').trim().slice(0, 300), content.trim()]
  );
  const [rows] = await pool.query('SELECT * FROM clinical_records WHERE id = ?', [r.insertId]);
  res.status(201).json(rows[0]);
});

export default router;
