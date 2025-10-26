-- Test script to verify code uniqueness
-- Run this in your Supabase SQL Editor

-- 1. Check for any duplicate codes in the database
SELECT 
  code, 
  COUNT(*) as count,
  array_agg(id) as ids,
  array_agg(party_id) as party_ids
FROM public.codes 
GROUP BY code 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Check total number of codes
SELECT COUNT(*) as total_codes FROM public.codes;

-- 3. Check codes by party
SELECT 
  party_id,
  COUNT(*) as code_count,
  COUNT(DISTINCT code) as unique_codes
FROM public.codes 
GROUP BY party_id
ORDER BY party_id;

-- 4. Check codes by price_name
SELECT 
  price_name,
  COUNT(*) as code_count,
  COUNT(DISTINCT code) as unique_codes
FROM public.codes 
GROUP BY price_name
ORDER BY price_name;

-- 5. Check for any codes that are already used
SELECT 
  already_used,
  COUNT(*) as count
FROM public.codes 
GROUP BY already_used;

-- 6. Show recent codes (last 10)
SELECT 
  id,
  code,
  party_id,
  price_name,
  already_used,
  created_at
FROM public.codes 
ORDER BY created_at DESC 
LIMIT 10;
