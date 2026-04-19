import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const schemaPath = path.join(__dirname, '../../sql/schema.sql');
  const raw = fs.readFileSync(schemaPath, 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Aplicando schema...');
  await conn.query(raw);

  await conn.query('USE shc_teleconsulta');
  const hash = await bcrypt.hash('demo123', 10);

  const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', ['admin@shc.local']);
  if (existing.length) {
    console.log('Datos demo ya existen (admin@shc.local). Saltando inserción de usuarios.');
    await conn.end();
    return;
  }

  console.log('Insertando usuarios demo...');
  await conn.query(
    `INSERT INTO users (email, password_hash, role, full_name, phone) VALUES
     ('admin@shc.local', ?, 'admin', 'Administrador SHC', NULL),
     ('doctora@shc.local', ?, 'doctor', 'Dra. Ana Pérez', '600111222'),
     ('doctor@shc.local', ?, 'doctor', 'Dr. Luis Gómez', '600333444'),
     ('paciente@shc.local', ?, 'patient', 'María Paciente Demo', '600555666')`,
    [hash, hash, hash, hash]
  );

  const [[admin]] = await conn.query('SELECT id FROM users WHERE email = ?', ['admin@shc.local']);
  const [[d1]] = await conn.query('SELECT id FROM users WHERE email = ?', ['doctora@shc.local']);
  const [[d2]] = await conn.query('SELECT id FROM users WHERE email = ?', ['doctor@shc.local']);
  const [[p1]] = await conn.query('SELECT id FROM users WHERE email = ?', ['paciente@shc.local']);

  await conn.query(
    `INSERT INTO doctor_profiles (user_id, specialty, professional_license, bio) VALUES
     (?, 'Psicología clínica', 'COL-10001', 'Terapia cognitivo-conductual.'),
     (?, 'Psicología general', 'COL-10002', 'Acompañamiento en ansiedad y estrés.')`,
    [d1.id, d2.id]
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await conn.query(
    `INSERT INTO appointments (patient_id, doctor_id, starts_at, duration_minutes, status, reason) VALUES
     (?, ?, ?, 45, 'confirmed', 'Primera consulta telemática'),
     (?, ?, ?, 45, 'pending', 'Seguimiento')`,
    [p1.id, d1.id, tomorrow, p1.id, d2.id, new Date(tomorrow.getTime() + 86400000)]
  );

  await conn.query(
    `INSERT INTO clinical_records (patient_id, doctor_id, title, content) VALUES
     (?, ?, 'Valoración inicial', 'Paciente refiere ansiedad leve. Se acuerda plan de teleseguimiento.')`,
    [p1.id, d1.id]
  );

  await conn.query(
    `INSERT INTO messages (sender_id, receiver_id, body) VALUES
     (?, ?, 'Hola doctora, confirmo la videollamada para mañana.'),
     (?, ?, 'Perfecto, le envío el enlace 10 minutos antes.')`,
    [p1.id, d1.id, d1.id, p1.id]
  );

  console.log('\n--- Usuarios demo (contraseña: demo123) ---');
  console.log('Admin:     admin@shc.local');
  console.log('Doctora:   doctora@shc.local');
  console.log('Doctor:    doctor@shc.local');
  console.log('Paciente:  paciente@shc.local');
  console.log('-------------------------------------------\n');

  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
