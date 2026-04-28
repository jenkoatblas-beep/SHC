/**
 * supabaseClient.js
 * -----------------
 * Cliente de Supabase para el servidor SHC.
 * Usa la SERVICE_ROLE key para tener acceso completo
 * (sin restricciones de RLS) desde el backend Node.js.
 *
 * Variables de entorno requeridas en server/.env:
 *   SUPABASE_URL      = https://<tu-proyecto>.supabase.co
 *   SUPABASE_SERVICE_KEY = eyJ...  (Settings → API → service_role)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[supabaseClient] Faltan variables de entorno SUPABASE_URL y/o SUPABASE_SERVICE_KEY.\n' +
    'Agrégalas en server/.env (ver server/.env.example).'
  );
}

/** @type {import('@supabase/supabase-js').SupabaseClient} */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // El backend gestiona su propia autenticación JWT; deshabilitamos
    // la persistencia de sesión de Supabase Auth.
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});

/**
 * Comprueba la conexión a Supabase realizando una consulta trivial.
 * Lanza un error si no puede conectar.
 * @returns {Promise<void>}
 */
export async function checkSupabaseConnection() {
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    throw new Error(`[supabaseClient] No se pudo conectar a Supabase: ${error.message}`);
  }
  console.log('[supabaseClient] ✓ Conexión a Supabase establecida correctamente.');
}
