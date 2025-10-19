-- Quick setup verification script
-- Run this in your Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if codes table exists
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

-- 5. Test basic operations
SELECT 'Testing INSERT...' as test_step;
INSERT INTO public.codes (party_id, code, price_name) 
VALUES (999, 'TEST123', 'Test') 
ON CONFLICT (code) DO NOTHING;

SELECT 'Testing SELECT...' as test_step;
SELECT COUNT(*) as total_codes FROM public.codes;

SELECT 'Testing DELETE...' as test_step;
DELETE FROM public.codes WHERE code = 'TEST123';

SELECT '✅ All tests passed!' as result;
