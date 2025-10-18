-- Test script to check what's in the database
-- Run this in your Supabase SQL Editor

-- 1. Check all parties and their administrator field
SELECT 
  id, 
  title, 
  administrator, 
  created_at,
  category
FROM public.parties 
ORDER BY created_at DESC;

-- 2. Check what admin users exist
SELECT 
  id, 
  name, 
  email, 
  is_admin
FROM public.users 
WHERE is_admin = true;

-- 3. Test the exact query the backend should use
-- Replace 'Pauly' with the actual admin name from step 2
SELECT 
  id, 
  title, 
  administrator, 
  created_at
FROM public.parties 
WHERE administrator = 'Pauly'
ORDER BY created_at DESC;

-- 4. Check if there are any parties with different administrator values
SELECT 
  administrator, 
  COUNT(*) as party_count
FROM public.parties 
GROUP BY administrator
ORDER BY party_count DESC;
