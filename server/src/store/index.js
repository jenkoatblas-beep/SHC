/**
 * store/index.js
 * --------------
 * Selector de backend de almacenamiento.
 * Lee la variable de entorno STORAGE_MODE para decidir qué store usar:
 *
 *   STORAGE_MODE=json      → jsonStore.js  (archivo JSON local, por defecto)
 *   STORAGE_MODE=supabase  → supabaseStore.js (PostgreSQL en Supabase)
 *
 * Las rutas de Express solo importan desde aquí y no necesitan saber
 * qué backend está activo.
 */

import dotenv from 'dotenv';
dotenv.config();

const mode = (process.env.STORAGE_MODE || 'json').toLowerCase();

let store;

if (mode === 'supabase') {
  store = await import('./supabaseStore.js');
  const { checkSupabaseConnection } = await import('./supabaseClient.js');
  await checkSupabaseConnection();
  console.log('[store] Modo: Supabase (PostgreSQL)');
} else {
  store = await import('./jsonStore.js');
  console.log('[store] Modo: JSON local');
}

export const { readQueued, withStore, nextId } = store;

// Re-exporta helpers específicos de cada backend (opcionales)
export default store;
