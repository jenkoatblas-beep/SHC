import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { withStore, readQueued } from './store/index.js';

dotenv.config();

async function main() {
  const exists = await readQueued((d) => d.users.some((u) => u.email === 'admin@shc.local'));
  if (exists) {
    console.log('Datos demo ya existen (admin@shc.local). No se modifica el JSON.');
    return;
  }

  const hash = await bcrypt.hash('demo123', 10);

  await withStore((data) => {
    for (const k of ['users', 'doctor_profiles', 'appointments', 'clinical_records', 'messages']) {
      data[k].length = 0;
    }

    const u1 = {
      id: 1,
      email: 'admin@shc.local',
      password_hash: hash,
      role: 'admin',
      full_name: 'Administrador SHC',
      phone: null,
      active: 1,
      created_at: new Date().toISOString(),
    };
    const u2 = {
      id: 2,
      email: 'doctora@shc.local',
      password_hash: hash,
      role: 'doctor',
      full_name: 'Dra. Ana Pérez',
      phone: '600111222',
      active: 1,
      created_at: new Date().toISOString(),
    };
    const u3 = {
      id: 3,
      email: 'doctor@shc.local',
      password_hash: hash,
      role: 'doctor',
      full_name: 'Dr. Luis Gómez',
      phone: '600333444',
      active: 1,
      created_at: new Date().toISOString(),
    };
    const u4 = {
      id: 4,
      email: 'paciente@shc.local',
      password_hash: hash,
      role: 'patient',
      full_name: 'María Paciente Demo',
      phone: '600555666',
      active: 1,
      created_at: new Date().toISOString(),
    };
    data.users.push(u1, u2, u3, u4);

    data.doctor_profiles.push(
      {
        user_id: 2,
        specialty: 'Psicología clínica',
        professional_license: 'COL-10001',
        bio: 'Terapia cognitivo-conductual.',
      },
      {
        user_id: 3,
        specialty: 'Psicología general',
        professional_license: 'COL-10002',
        bio: 'Acompañamiento en ansiedad y estrés.',
      }
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const t2 = new Date(tomorrow.getTime() + 86400000);

    data.appointments.push(
      {
        id: 1,
        patient_id: 4,
        doctor_id: 2,
        starts_at: tomorrow.toISOString(),
        duration_minutes: 45,
        status: 'confirmed',
        reason: 'Primera consulta telemática',
        notes_doctor: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        patient_id: 4,
        doctor_id: 3,
        starts_at: t2.toISOString(),
        duration_minutes: 45,
        status: 'pending',
        reason: 'Seguimiento',
        notes_doctor: null,
        created_at: new Date().toISOString(),
      }
    );

    data.clinical_records.push({
      id: 1,
      patient_id: 4,
      doctor_id: 2,
      appointment_id: null,
      title: 'Valoración inicial',
      content: 'Paciente refiere ansiedad leve. Se acuerda plan de teleseguimiento.',
      created_at: new Date().toISOString(),
    });

    data.messages.push(
      {
        id: 1,
        sender_id: 4,
        receiver_id: 2,
        body: 'Hola doctora, confirmo la videollamada para mañana.',
        read_at: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        sender_id: 2,
        receiver_id: 4,
        body: 'Perfecto, le envío el enlace 10 minutos antes.',
        read_at: null,
        created_at: new Date().toISOString(),
      }
    );
  });

  console.log('\n--- Datos JSON creados (contraseña web: demo123) ---');
  console.log('Admin:     admin@shc.local');
  console.log('Doctora:   doctora@shc.local');
  console.log('Doctor:    doctor@shc.local');
  console.log('Paciente:  paciente@shc.local');
  console.log('---------------------------------------------------\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
