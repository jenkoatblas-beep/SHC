import { Router } from 'express';
import { withStore, readQueued, nextId } from '../store/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function parseLocalDateTime(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function userById(data, id) {
  return data.users.find((u) => u.id === id);
}

router.get('/mine', requireAuth, async (req, res) => {
  const uid = req.user.id;
  const role = req.user.role;
  if (role !== 'patient' && role !== 'doctor') {
    return res.status(403).json({ error: 'Solo paciente o doctor' });
  }
  const rows = await readQueued((data) => {
    const list = data.appointments
      .filter((a) => (role === 'patient' ? a.patient_id === uid : a.doctor_id === uid))
      .sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
    return list.map((a) => {
      const d = userById(data, a.doctor_id);
      const p = userById(data, a.patient_id);
      return {
        ...a,
        starts_at: a.starts_at,
        doctorName: d?.full_name,
        doctorEmail: d?.email,
        patientName: p?.full_name,
        patientEmail: p?.email,
        patientPhone: p?.phone,
      };
    });
  });
  res.json(rows);
});

router.post('/', requireAuth, requireRole('patient'), async (req, res) => {
  const { doctorId, startsAt, reason, durationMinutes } = req.body;
  const doctorIdNum = Number(doctorId);
  if (!doctorIdNum) return res.status(400).json({ error: 'doctorId requerido' });
  const start = parseLocalDateTime(startsAt);
  if (!start) return res.status(400).json({ error: 'Fecha/hora inválida' });

  const doc = await readQueued((data) =>
    data.users.find((u) => u.id === doctorIdNum && u.role === 'doctor' && u.active)
  );
  if (!doc) return res.status(404).json({ error: 'Psicólogo no encontrado' });

  const dur = Math.min(180, Math.max(15, Number(durationMinutes) || 45));
  const row = await withStore((data) => {
    const id = nextId(data);
    const a = {
      id,
      patient_id: req.user.id,
      doctor_id: doctorIdNum,
      starts_at: start.toISOString(),
      duration_minutes: dur,
      reason: reason?.trim() || null,
      notes_doctor: null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    data.appointments.push(a);
    return a;
  });
  res.status(201).json(row);
});

router.patch('/:id', requireAuth, requireRole('doctor'), async (req, res) => {
  const id = Number(req.params.id);
  const { status, notesDoctor } = req.body;
  const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
  const row = await withStore((data) => {
    const a = data.appointments.find((x) => x.id === id && x.doctor_id === req.user.id);
    if (!a) return { err: 'nf' };
    let changed = false;
    if (status && allowed.includes(status)) {
      a.status = status;
      changed = true;
    }
    if (notesDoctor !== undefined) {
      a.notes_doctor = notesDoctor;
      changed = true;
    }
    if (!changed) return { err: 'noop' };
    return a;
  });
  if (row?.err === 'nf') return res.status(404).json({ error: 'Cita no encontrada' });
  if (row?.err === 'noop') return res.status(400).json({ error: 'Nada que actualizar' });
  res.json(row);
});

router.post('/:id/cancel', requireAuth, requireRole('patient'), async (req, res) => {
  const id = Number(req.params.id);
  const row = await withStore((data) => {
    const a = data.appointments.find(
      (x) => x.id === id && x.patient_id === req.user.id && ['pending', 'confirmed'].includes(x.status)
    );
    if (!a) return null;
    a.status = 'cancelled';
    return a;
  });
  if (!row) return res.status(404).json({ error: 'No se pudo cancelar' });
  res.json(row);
});

export default router;
