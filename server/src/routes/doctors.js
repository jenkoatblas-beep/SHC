import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** Lista de psicólogos activos (para que el paciente elija) */
router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name AS fullName, u.email, u.phone,
            dp.specialty, dp.professional_license AS license, dp.bio
     FROM users u
     JOIN doctor_profiles dp ON dp.user_id = u.id
     WHERE u.role = 'doctor' AND u.active = 1
     ORDER BY u.full_name`
  );
  res.json(rows);
});

export default router;
