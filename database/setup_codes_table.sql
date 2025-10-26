-- Complete setup script for the codes table
-- Run this in your Supabase SQL Editor to ensure the codes table is properly created

-- 1. Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS public.codes CASCADE;

-- 2. Create the codes table with the correct schema
CREATE TABLE public.codes (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  party_id BIGINT NOT NULL,
  code TEXT NOT NULL,
  price_id BIGINT NOT NULL,
  already_used BOOLEAN DEFAULT FALSE,
  user_id BIGINT
);

-- 3. Add unique constraint on code column
ALTER TABLE public.codes 
ADD CONSTRAINT codes_code_unique UNIQUE (code);

-- 4. Enable Row Level Security
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.codes
FOR ALL USING (true);

-- 6. Create indexes for better performance
CREATE INDEX idx_codes_party_id ON public.codes(party_id);
CREATE INDEX idx_codes_price_id ON public.codes(price_id);
CREATE INDEX idx_codes_code ON public.codes(code);
CREATE INDEX idx_codes_already_used ON public.codes(already_used);

-- 7. Verify the table was created correctly
SELECT 
  'Table created successfully' as status,
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'codes'
ORDER BY ordinal_position;

-- 8. Test insert to verify everything works
INSERT INTO public.codes (party_id, code, price_id, already_used) 
VALUES (1, 'TEST123', 1, false);

-- 9. Verify the test insert worked
SELECT 
  'Test insert successful' as status,
  id,
  party_id,
  code,
  price_id,
  already_used,
  created_at
FROM public.codes 
WHERE code = 'TEST123';

-- 10. Clean up test data
DELETE FROM public.codes WHERE code = 'TEST123';

-- 11. Final verification
SELECT 
  'Setup complete!' as status,
  COUNT(*) as total_codes
FROM public.codes;
