-- Quick test script to verify codes table setup
-- Run this in your Supabase SQL Editor after running setup_codes_table.sql

-- 1. Check if codes table exists and is accessible
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'codes') 
    THEN '✅ Codes table exists'
    ELSE '❌ Codes table does not exist'
  END as table_status;

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'codes'
ORDER BY ordinal_position;

-- 3. Check constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'codes';

-- 4. Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'codes';

-- 5. Test insert operation
INSERT INTO public.codes (party_id, code, price_id, already_used) 
VALUES (999, 'TEST123', 1, false)
ON CONFLICT (code) DO NOTHING;

-- 6. Verify insert worked
SELECT 
  id,
  party_id,
  code,
  price_id,
  already_used,
  created_at
FROM public.codes 
WHERE code = 'TEST123';

-- 7. Clean up test data
DELETE FROM public.codes WHERE code = 'TEST123';

-- 8. Final status
SELECT '✅ All tests passed! Codes table is ready for use.' as result;
