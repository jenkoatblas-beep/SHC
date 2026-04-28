/**
 * supabaseStore.js
 * ----------------
 * Capa de acceso a datos usando Supabase (PostgreSQL).
 * Es un reemplazo directo de jsonStore.js con la misma API pública,
 * por lo que las rutas de Express no necesitan cambios.
 *
 * API exportada (mismos nombres que jsonStore.js):
 *   readQueued(reader)   → solo lectura
 *   withStore(fn)        → lectura + escritura (transaccional vía callback)
 *   nextId(data)         → NO NECESARIO con BIGSERIAL, pero se mantiene
 *                          por compatibilidad (devuelve null).
 *
 * Funciones adicionales Supabase:
 *   getSupabase()        → devuelve el cliente crudo para consultas avanzadas
 */

import { supabase } from './supabaseClient.js';

/** Devuelve el cliente Supabase para consultas avanzadas */
export function getSupabase() {
  return supabase;
}

/**
 * Estructura "data" compatible con jsonStore:
 *   { users, doctor_profiles, appointments, clinical_records, messages }
 * Cada campo es un array de filas traídas de Supabase.
 *
 * @returns {Promise<import('./jsonStore.js').StoreData>}
 */
async function fetchAllData() {
  const [users, doctor_profiles, patient_profiles, appointments, clinical_records, messages] = await Promise.all([
    supabase.from('users').select('*').then(r => r.data ?? []),
    supabase.from('doctor_profiles').select('*').then(r => r.data ?? []),
    supabase.from('patient_profiles').select('*').then(r => r.data ?? []),
    supabase.from('appointments').select('*').then(r => r.data ?? []),
    supabase.from('clinical_records').select('*').then(r => r.data ?? []),
    supabase.from('messages').select('*').then(r => r.data ?? []),
  ]);
  return { users, doctor_profiles, patient_profiles, appointments, clinical_records, messages };
}

/**
 * readQueued — equivalente a jsonStore.readQueued.
 * Trae todos los datos de Supabase y ejecuta el reader.
 *
 * @template T
 * @param {(data: ReturnType<fetchAllData>) => T | Promise<T>} reader
 * @returns {Promise<T>}
 */
export async function readQueued(reader) {
  const data = await fetchAllData();
  return reader(data);
}

/**
 * withStore — equivalente a jsonStore.withStore.
 * Trae todos los datos, ejecuta fn (que puede mutar `data` en memoria
 * y devolver el resultado) y sincroniza los cambios con Supabase.
 *
 * ⚠️  Esta implementación NO es transaccional a nivel DB.
 *     Si necesitas atomicidad real, usa supabase.rpc() con funciones PL/pgSQL.
 *
 * @template T
 * @param {(data: ReturnType<fetchAllData>) => T | Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withStore(fn) {
  const data = await fetchAllData();

  // Capturamos snapshots antes de la mutación
  const before = {
    users:            data.users.map(r => r.id),
    doctor_profiles:  data.doctor_profiles.map(r => r.user_id),
    patient_profiles: data.patient_profiles.map(r => r.user_id),
    appointments:     data.appointments.map(r => r.id),
    clinical_records: data.clinical_records.map(r => r.id),
    messages:         data.messages.map(r => r.id),
  };

  const result = await fn(data);

  // Sincronizar inserciones / actualizaciones detectando filas nuevas o modificadas
  await syncTable('users',            data.users,            before.users,            'id');
  await syncTable('doctor_profiles',  data.doctor_profiles,  before.doctor_profiles,  'user_id');
  await syncTable('patient_profiles', data.patient_profiles, before.patient_profiles, 'user_id');
  await syncTable('appointments',     data.appointments,     before.appointments,     'id');
  await syncTable('clinical_records', data.clinical_records, before.clinical_records, 'id');
  await syncTable('messages',         data.messages,         before.messages,         'id');

  return result;
}

/**
 * Detecta filas nuevas en `rows` (cuyo pk no estaba en `prevIds`)
 * y las inserta en Supabase. Las filas existentes se actualizan (upsert).
 *
 * @param {string} table
 * @param {object[]} rows
 * @param {(number|string)[]} prevIds
 * @param {string} pkField
 */
async function syncTable(table, rows, prevIds, pkField) {
  if (!rows.length) return;
  const prevSet = new Set(prevIds);
  const toUpsert = rows.filter(r => !prevSet.has(r[pkField]) || true);
  if (!toUpsert.length) return;

  // upsert: inserta si no existe, actualiza si ya existe
  const { error } = await supabase.from(table).upsert(toUpsert, { onConflict: pkField });
  if (error) {
    throw new Error(`[supabaseStore] Error al sincronizar tabla "${table}": ${error.message}`);
  }
}

export function nextId(data) {
  const all = [
    ...data.users.map((u) => u.id),
    ...data.doctor_profiles.map((d) => d.user_id),
    ...data.patient_profiles.map((p) => p.user_id),
    ...data.appointments.map((a) => a.id),
    ...data.clinical_records.map((r) => r.id),
    ...data.messages.map((m) => m.id),
  ];
  return (all.length ? Math.max(...all) : 0) + 1;
}
