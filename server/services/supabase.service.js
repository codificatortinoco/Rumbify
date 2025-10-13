require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración básica de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
// Priorizar Service Role para operaciones de servidor (bypass RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_API_KEY;

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Log no sensible para confirmar la clave usada
if (process.env.SUPABASE_SERVICE_ROLE) {
  console.log('[Supabase] Using service_role key');
} else {
  console.log('[Supabase] Using public API key');
}

module.exports = supabase;
