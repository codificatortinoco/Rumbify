-- Comprehensive debugging script for codes table issues
-- Run this in your Supabase SQL Editor to diagnose the problem

-- 1. Check if Codes table exists (case-sensitive)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Codes') 
    THEN '✅ Codes table exists'
    ELSE '❌ Codes table does not exist - THIS IS THE PROBLEM!'
  END as table_status;

-- 2. If table exists, check its structure
SELECT 
  'Table structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Codes'
ORDER BY ordinal_position;

-- 3. Check if there are any codes in the table
SELECT 
  'Current codes count:' as info,
  COUNT(*) as total_codes
FROM public."Codes";

-- 4. Check recent codes (if any exist)
SELECT 
  'Recent codes:' as info,
  id,
  party_id,
  code,
  price_id,
  already_used,
  created_at
FROM public."Codes" 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check table permissions and RLS policies
SELECT 
  'RLS Policies:' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'Codes';

-- 6. Test insert operation
SELECT 'Testing INSERT operation...' as test_step;

-- Try to insert a test code
INSERT INTO public."Codes" (party_id, code, price_id, already_used) 
VALUES (999, 'DEBUG123', 1, false)
ON CONFLICT (code) DO NOTHING;

-- 7. Verify the test insert worked
SELECT 
  'Test insert result:' as info,
  id,
  party_id,
  code,
  price_id,
  already_used,
  created_at
FROM public."Codes" 
WHERE code = 'DEBUG123';

-- 8. Clean up test data
DELETE FROM public."Codes" WHERE code = 'DEBUG123';

-- 9. Check if prices table exists (needed for foreign key)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prices') 
    THEN '✅ Prices table exists'
    ELSE '❌ Prices table does not exist - THIS COULD BE THE PROBLEM!'
  END as prices_table_status;

-- 10. Check if parties table exists (needed for foreign key)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parties') 
    THEN '✅ Parties table exists'
    ELSE '❌ Parties table does not exist - THIS COULD BE THE PROBLEM!'
  END as parties_table_status;

-- 11. Check for any foreign key constraints that might be blocking inserts
SELECT 
  'Foreign key constraints:' as info,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'Codes';

-- 12. Final diagnostic summary
SELECT 
  'DIAGNOSTIC SUMMARY:' as summary,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Codes') 
    THEN 'Codes table exists'
    ELSE 'Codes table MISSING'
  END as codes_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prices') 
    THEN 'Prices table exists'
    ELSE 'Prices table MISSING'
  END as prices_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parties') 
    THEN 'Parties table exists'
    ELSE 'Parties table MISSING'
  END as parties_table;
