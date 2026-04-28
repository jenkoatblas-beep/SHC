  -- =============================================================================
  -- SHC TELECONSULTA – Esquema Supabase (PostgreSQL)
  -- =============================================================================
  -- Ejecutar en el SQL Editor de tu proyecto Supabase.
  -- Orden: extensiones → tablas → índices → RLS → funciones → seed.
  -- =============================================================================

  -- ---------------------------------------------------------------------------
  -- 0. EXTENSIONES
  -- ---------------------------------------------------------------------------
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

  -- ---------------------------------------------------------------------------
  -- 1. TIPOS ENUMERADOS
  -- ---------------------------------------------------------------------------
  DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  -- ---------------------------------------------------------------------------
  -- 2. TABLAS
  -- ---------------------------------------------------------------------------

  -- 2.1 Usuarios de la aplicación
  --   NOTA: La columna `id` usa BIGSERIAL para compatibilidad con el código
  --   existente (IDs enteros). Supabase Auth vive aparte; password_hash se
  --   mantiene para la autenticación propia con JWT (bcryptjs).
  CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL         PRIMARY KEY,
    email         VARCHAR(255)      NOT NULL UNIQUE,
    password_hash VARCHAR(255)      NOT NULL,
    role          user_role         NOT NULL DEFAULT 'patient',
    full_name     VARCHAR(200)      NOT NULL,
    phone         VARCHAR(50),
    active        BOOLEAN           NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW()
  );

  -- 2.2 Perfiles de doctores (1-to-1 con users)
  CREATE TABLE IF NOT EXISTS doctor_profiles (
    user_id               BIGINT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    specialty             VARCHAR(200)  NOT NULL DEFAULT 'Psicología clínica',
    professional_license  VARCHAR(100),
    bio                   TEXT
  );

  -- 2.3 Perfiles de pacientes (1-to-1 con users)
  CREATE TABLE IF NOT EXISTS patient_profiles (
    user_id               BIGINT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    edad                  INT,
    genero                VARCHAR(50)
  );

  -- 2.4 Citas / teleconsultas
  CREATE TABLE IF NOT EXISTS appointments (
    id                BIGSERIAL           PRIMARY KEY,
    patient_id        BIGINT              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id         BIGINT              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    starts_at         TIMESTAMPTZ         NOT NULL,
    duration_minutes  INT                 NOT NULL DEFAULT 45 CHECK (duration_minutes BETWEEN 15 AND 180),
    status            appointment_status  NOT NULL DEFAULT 'pending',
    reason            TEXT,
    notes_doctor      TEXT,
    created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW()
  );

  -- 2.5 Historias / registros clínicos
  CREATE TABLE IF NOT EXISTS clinical_records (
    id              BIGSERIAL     PRIMARY KEY,
    patient_id      BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id       BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id  BIGINT        REFERENCES appointments(id) ON DELETE SET NULL,
    title           VARCHAR(300)  NOT NULL DEFAULT 'Consulta',
    content         TEXT          NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  );

  -- 2.6 Mensajes de chat
  CREATE TABLE IF NOT EXISTS messages (
    id           BIGSERIAL    PRIMARY KEY,
    sender_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id  BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body         TEXT         NOT NULL CHECK (LENGTH(body) <= 8000),
    read_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  -- ---------------------------------------------------------------------------
  -- 3. ÍNDICES
  -- ---------------------------------------------------------------------------
  CREATE INDEX IF NOT EXISTS idx_appointments_patient   ON appointments(patient_id, starts_at);
  CREATE INDEX IF NOT EXISTS idx_appointments_doctor    ON appointments(doctor_id,  starts_at);
  CREATE INDEX IF NOT EXISTS idx_records_patient        ON clinical_records(patient_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_records_doctor         ON clinical_records(doctor_id,  created_at);
  CREATE INDEX IF NOT EXISTS idx_messages_sender        ON messages(sender_id,   created_at);
  CREATE INDEX IF NOT EXISTS idx_messages_receiver      ON messages(receiver_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);

  -- ---------------------------------------------------------------------------
  -- 4. ROW LEVEL SECURITY (RLS)
  -- ---------------------------------------------------------------------------
  -- NOTA: El backend Node.js se conecta con el rol `service_role` (clave secreta),
  -- por lo que las políticas siguientes aplican a cualquier cliente directo
  -- (e.g. Supabase JS SDK desde el frontend).  Si solo usas el backend propio
  -- puedes omitir esta sección, pero es recomendable tenerla.
  -- ---------------------------------------------------------------------------

  ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
  ALTER TABLE doctor_profiles   ENABLE ROW LEVEL SECURITY;
  ALTER TABLE patient_profiles  ENABLE ROW LEVEL SECURITY;
  ALTER TABLE appointments      ENABLE ROW LEVEL SECURITY;
  ALTER TABLE clinical_records  ENABLE ROW LEVEL SECURITY;
  ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;

  -- Política genérica: el service_role (backend) puede hacer todo.
  -- Los clientes anónimos o con JWT propio no tienen acceso directo.

  DROP POLICY IF EXISTS "service_role_all_users" ON users;
  CREATE POLICY "service_role_all_users"
    ON users FOR ALL
    TO service_role USING (TRUE) WITH CHECK (TRUE);

  DROP POLICY IF EXISTS "service_role_all_doctor_profiles" ON doctor_profiles;
  CREATE POLICY "service_role_all_doctor_profiles"
    ON doctor_profiles FOR ALL
    TO service_role USING (TRUE) WITH CHECK (TRUE);

  DROP POLICY IF EXISTS "service_role_all_patient_profiles" ON patient_profiles;
  CREATE POLICY "service_role_all_patient_profiles"
    ON patient_profiles FOR ALL
    TO service_role USING (TRUE) WITH CHECK (TRUE);

  DROP POLICY IF EXISTS "service_role_all_appointments" ON appointments;
  CREATE POLICY "service_role_all_appointments"
    ON appointments FOR ALL
    TO service_role USING (TRUE) WITH CHECK (TRUE);

  DROP POLICY IF EXISTS "service_role_all_clinical_records" ON clinical_records;
  CREATE POLICY "service_role_all_clinical_records"
    ON clinical_records FOR ALL
    TO service_role USING (TRUE) WITH CHECK (TRUE);

  DROP POLICY IF EXISTS "service_role_all_messages" ON messages;
  CREATE POLICY "service_role_all_messages"
    ON messages FOR ALL
    TO service_role USING (TRUE) WITH CHECK (TRUE);

  -- ---------------------------------------------------------------------------
  -- 5. FUNCIÓN AUXILIAR: next_shc_id()
  --    Mantiene la lógica de nextId() del jsonStore pero en SQL.
  --    Úsala desde el backend si necesitas IDs globales únicos (opcional).
  -- ---------------------------------------------------------------------------
  CREATE OR REPLACE FUNCTION next_shc_id()
  RETURNS BIGINT LANGUAGE SQL AS $$
    SELECT GREATEST(
      COALESCE((SELECT MAX(id) FROM users),            0),
      COALESCE((SELECT MAX(id) FROM appointments),     0),
      COALESCE((SELECT MAX(id) FROM clinical_records), 0),
      COALESCE((SELECT MAX(id) FROM messages),         0)
    ) + 1;
  $$;

  -- ---------------------------------------------------------------------------
  -- 6. DATOS SEMILLA (seed)
  --    Contraseña demo para todos: demo123
  --    Hash bcrypt rounds=10: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHuu
  --    (Si necesitas regenerarlo: node -e "const b=require('bcryptjs');b.hash('demo123',10).then(console.log)")
  -- ---------------------------------------------------------------------------
  DO $$
  DECLARE
    demo_hash TEXT := '$2a$10$sa9v74MBtbOI1aC7Tak2h.PzAQRCV5gM.rP3ONoZ7W.Z/D00buGTO';
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@shc.local') THEN

      -- Usuarios base
      INSERT INTO users (id, email, password_hash, role, full_name, phone, active) VALUES
        (1, 'admin@shc.local',    demo_hash, 'admin',   'Administrador SHC',      NULL,          TRUE),
        (2, 'doctora@shc.local',  demo_hash, 'doctor',  'Dra. Ana Pérez',         '600111222',   TRUE),
        (3, 'doctor@shc.local',   demo_hash, 'doctor',  'Dr. Luis Gómez',         '600333444',   TRUE),
        (4, 'paciente@shc.local', demo_hash, 'patient', 'María Paciente Demo',    '600555666',   TRUE);

      -- Sincronizar secuencias SERIAL con los IDs insertados
      PERFORM setval(pg_get_serial_sequence('users', 'id'), 4);

      -- Perfiles de doctores
      INSERT INTO doctor_profiles (user_id, specialty, professional_license, bio) VALUES
        (2, 'Psicología clínica',  'COL-10001', 'Terapia cognitivo-conductual.'),
        (3, 'Psicología general',  'COL-10002', 'Acompañamiento en ansiedad y estrés.');

      -- Perfiles de pacientes
      INSERT INTO patient_profiles (user_id, edad, genero) VALUES
        (4, 30, 'Femenino');

      -- Citas demo (mañana y pasado mañana)
      INSERT INTO appointments (id, patient_id, doctor_id, starts_at, duration_minutes, status, reason) VALUES
        (1, 4, 2, NOW() + INTERVAL '1 day',  45, 'confirmed', 'Primera consulta telemática'),
        (2, 4, 3, NOW() + INTERVAL '2 days', 45, 'pending',   'Seguimiento');

      PERFORM setval(pg_get_serial_sequence('appointments', 'id'), 2);

      -- Historia clínica demo
      INSERT INTO clinical_records (id, patient_id, doctor_id, appointment_id, title, content) VALUES
        (1, 4, 2, NULL, 'Valoración inicial', 'Paciente refiere ansiedad leve. Se acuerda plan de teleseguimiento.');

      PERFORM setval(pg_get_serial_sequence('clinical_records', 'id'), 1);

      -- Mensajes demo
      INSERT INTO messages (id, sender_id, receiver_id, body) VALUES
        (1, 4, 2, 'Hola doctora, confirmo la videollamada para mañana.'),
        (2, 2, 4, 'Perfecto, le envío el enlace 10 minutos antes.');

      PERFORM setval(pg_get_serial_sequence('messages', 'id'), 2);

      RAISE NOTICE '✓ Datos semilla insertados. Contraseña demo: demo123';
    ELSE
      RAISE NOTICE '→ Datos semilla ya existen, no se modifican.';
    END IF;
  END $$;

  -- ---------------------------------------------------------------------------
  -- FIN DEL SCRIPT
  -- Ejecuta este archivo completo en:
  --   Supabase Dashboard → SQL Editor → New query → Paste → Run
  -- ---------------------------------------------------------------------------
