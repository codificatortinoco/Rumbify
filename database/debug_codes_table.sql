-- Test script to check if codes table exists and is accessible
-- Run this in your Supabase SQL Editor

-- 1. Check if codes table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'codes'
ORDER BY ordinal_position;

-- 2. Check table permissions
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'codes';

-- 3. Test basic query
SELECT COUNT(*) as total_codes FROM public.codes;

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'codes';

-- 5. If table doesn't exist, create it
-- (Uncomment if needed)
/*
CREATE TABLE public.codes (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  party_id BIGINT NOT NULL,
  code TEXT NOT NULL,
  price_name TEXT NOT NULL,
  already_used BOOLEAN DEFAULT FALSE,
  user_id BIGINT
);

-- Add unique constraint
ALTER TABLE public.codes 
ADD CONSTRAINT codes_code_unique UNIQUE (code);

-- Add RLS policies
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.codes
FOR ALL USING (true);
*/
