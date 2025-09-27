const { createClient } = require("@supabase/supabase-js");

// Get environment variables with fallback values
const supabaseUrl = process.env.SUPABASE_URL || "https://brqucbjfhlarzrspgoto.supabase.co";
const supabaseKey = process.env.SUPABASE_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycXVjYmpmaGxhcnpyc3Bnb3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODgxMTUsImV4cCI6MjA3NDQ2NDExNX0.0AoeSubn25i8GfJLq5kTJ9JIMrL9Y3YvqYL3RnsHoyg";

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
