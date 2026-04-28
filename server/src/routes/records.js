import { Router } from 'express';
import { withStore, readQueued, nextId } from '../store/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/mine', requireAuth, async (req, res) => {
  const uid = req.user.id;
  const role = req.user.role;

  if (role === 'patient') {
    const rows = await readQueued((data) => {
      return data.clinical_records
        .filter((r) => r.patient_id === uid)
        .map((r) => {
          const doc = data.users.find((u) => u.id === r.doctor_id);
          return {
            id: r.id,
            title: r.title,
            content: r.content,
            createdAt: r.created_at,
            doctorId: r.doctor_id,
            doctorName: doc?.full_name || '',
            appointmentId: r.appointment_id,
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    return res.json(rows);
  }

  if (role === 'doctor') {
    const patients = await readQueued((data) => {
      const patientIds = new Set();
      for (const a of data.appointments) {
        if (a.doctor_id === uid) patientIds.add(a.patient_id);
      }
      for (const r of data.clinical_records) {
        if (r.doctor_id === uid) patientIds.add(r.patient_id);
      }
      return [...patientIds]
        .map((pid) => {
          const u = data.users.find((x) => x.id === pid && x.role === 'patient' && x.active);
          if (!u) return null;
          return { patientId: u.id, patientName: u.full_name, email: u.email, phone: u.phone };
        })
        .filter(Boolean)
        .sort((a, b) => String(a.patientName).localeCompare(b.patientName));
    });
    return res.json({ patients });
  }

  return res.status(403).json({ error: 'Solo paciente o doctor' });
});

router.get('/patient/:patientId', requireAuth, requireRole('doctor'), async (req, res) => {
  const patientId = Number(req.params.patientId);
  const rows = await readQueued((data) => {
    const hasRel =
      data.appointments.some((a) => a.patient_id === patientId && a.doctor_id === req.user.id) ||
      data.clinical_records.some((r) => r.patient_id === patientId && r.doctor_id === req.user.id);
    const p = data.users.find(u => u.id === patientId && u.role === 'patient');
    if (!p) return { error: true };
    const prof = data.patient_profiles?.find(pp => pp.user_id === patientId);

    const records = data.clinical_records
      .filter((r) => r.patient_id === patientId && r.doctor_id === req.user.id)
      .map((r) => ({ ...r, createdAt: r.created_at }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      patient: {
        id: p.id,
        fullName: p.full_name,
        email: p.email,
        phone: p.phone,
        edad: prof?.edad || null,
        genero: prof?.genero || null,
      },
      records
    };
  });
  if (rows?.error) {
    return res.status(403).json({ error: 'No tiene relación clínica con este paciente o el paciente no existe' });
  }
  res.json(rows);
});

router.post('/', requireAuth, requireRole('doctor'), async (req, res) => {
  const { patientId, title, content, appointmentId } = req.body;
  const pid = Number(patientId);
  if (!pid || !content?.trim()) {
    return res.status(400).json({ error: 'patientId y contenido son obligatorios' });
  }
  const p = await readQueued((data) => data.users.find((u) => u.id === pid && u.role === 'patient'));
  if (!p) return res.status(404).json({ error: 'Paciente no encontrado' });

  let aptId = appointmentId ? Number(appointmentId) : null;
  if (aptId) {
    const ok = await readQueued((data) =>
      data.appointments.some((a) => a.id === aptId && a.patient_id === pid && a.doctor_id === req.user.id)
    );
    if (!ok) aptId = null;
  }

  const row = await withStore((data) => {
    const id = nextId(data);
    const r = {
      id,
      patient_id: pid,
      doctor_id: req.user.id,
      appointment_id: aptId,
      title: (title || 'Consulta').trim().slice(0, 300),
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    data.clinical_records.push(r);
    return r;
  });
  res.status(201).json(row);
});

export default router;
