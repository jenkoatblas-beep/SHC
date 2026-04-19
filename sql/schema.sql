-- Base de datos: historias clínicas + teleconsulta psicológica
CREATE DATABASE IF NOT EXISTS shc_teleconsulta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shc_teleconsulta;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient','doctor','admin') NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_profiles (
  user_id INT PRIMARY KEY,
  specialty VARCHAR(200) DEFAULT 'Psicología clínica',
  professional_license VARCHAR(100),
  bio TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  starts_at DATETIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 45,
  status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  reason TEXT,
  notes_doctor TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE clinical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT NULL,
  title VARCHAR(300) NOT NULL DEFAULT 'Consulta',
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  body TEXT NOT NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id, starts_at);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id, starts_at);
CREATE INDEX idx_records_patient ON clinical_records(patient_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, created_at);
