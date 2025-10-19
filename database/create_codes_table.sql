-- Create the codes table if it doesn't exist
-- Run this in your Supabase SQL Editor

-- 1. Create the codes table
CREATE TABLE IF NOT EXISTS public.codes (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  party_id BIGINT NOT NULL,
  code TEXT NOT NULL,
  price_name TEXT NOT NULL,
  already_used BOOLEAN DEFAULT FALSE,
  user_id BIGINT
);

-- 2. Add unique constraint on code column
ALTER TABLE public.codes 
ADD CONSTRAINT IF NOT EXISTS codes_code_unique UNIQUE (code);

-- 3. Enable Row Level Security
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for authenticated users
CREATE POLICY IF NOT EXISTS "Allow all operations for authenticated users" ON public.codes
FOR ALL USING (true);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_codes_party_id ON public.codes(party_id);
CREATE INDEX IF NOT EXISTS idx_codes_code ON public.codes(code);
CREATE INDEX IF NOT EXISTS idx_codes_already_used ON public.codes(already_used);

-- 6. Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'codes'
ORDER BY ordinal_position;
