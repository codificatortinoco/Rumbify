const { createClient } = require('@supabase/supabase-js');

// Configuración básica de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
