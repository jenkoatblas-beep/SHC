import { Router } from 'express';
import { readQueued } from '../store/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const rows = await readQueued((data) => {
    return data.users
      .filter((u) => u.role === 'doctor' && u.active)
      .map((u) => {
        const dp = data.doctor_profiles.find((d) => d.user_id === u.id) || {};
        return {
          id: u.id,
          fullName: u.full_name,
          email: u.email,
          phone: u.phone,
          specialty: dp.specialty || 'Psicología clínica',
          license: dp.professional_license || null,
          bio: dp.bio || null,
        };
      })
      .sort((a, b) => String(a.fullName).localeCompare(b.fullName));
  });
  res.json(rows);
});

export default router;
