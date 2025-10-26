-- Quick diagnostic script for Add Party functionality
-- Run this in your Supabase SQL Editor to check the current state

-- 1. Check if party_history column exists in users table
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'party_history'
    ) 
    THEN '✅ party_history column exists'
    ELSE '❌ party_history column MISSING - Run add_party_history_to_users.sql'
  END as column_status;

-- 2. Check if Codes table exists and has data
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Codes') 
    THEN '✅ Codes table exists'
    ELSE '❌ Codes table MISSING'
  END as codes_table_status;

-- 3. Count codes in Codes table
SELECT 
  'Codes count:' as info,
  COUNT(*) as total_codes
FROM public."Codes";

-- 4. Show sample codes
SELECT 
  'Sample codes:' as info,
  id,
  code,
  party_id,
  price_id,
  already_used,
  created_at
FROM public."Codes" 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Check if parties table has data
SELECT 
  'Parties count:' as info,
  COUNT(*) as total_parties
FROM public.parties;

-- 6. Check if prices table has data
SELECT 
  'Prices count:' as info,
  COUNT(*) as total_prices
FROM public.prices;

-- 7. Check users table structure
SELECT 
  'Users table columns:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 8. If party_history column exists, check its current state
SELECT 
  'Users with party_history:' as info,
  COUNT(*) as users_with_history
FROM public.users 
WHERE party_history IS NOT NULL;
