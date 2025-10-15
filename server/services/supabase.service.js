require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración básica de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase configuration');
  console.error('Please create a .env file with SUPABASE_URL and SUPABASE_API_KEY');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`[Supabase] Connected to: ${supabaseUrl.substring(0, 30)}...`);

// Función para verificar la conexión
async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    console.log('Supabase connection test successful');
    return true;
  } catch (err) {
    console.error('Supabase connection test error:', err.message);
    return false;
  }
}

// Ejecutar test de conexión al inicializar
testConnection();

module.exports = supabase;
