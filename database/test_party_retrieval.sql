-- Test script to debug party retrieval issues
-- Run this in your Supabase SQL Editor

-- 1. Check what parties exist in the database
SELECT 
  id, 
  title, 
  administrator, 
  created_at, 
  category,
  location,
  date
FROM public.parties 
ORDER BY created_at DESC;

-- 2. Check what admin users exist
SELECT 
  id, 
  name, 
  email, 
  is_admin,
  created_at
FROM public.users 
WHERE is_admin = true
ORDER BY created_at DESC;

-- 3. Test the exact query that the backend uses
-- Replace 'pauly@gmail.com' with your actual admin email
SELECT 
  id, 
  title, 
  administrator, 
  created_at, 
  category
FROM public.parties 
WHERE administrator = 'pauly@gmail.com'
ORDER BY created_at DESC;

-- 4. Check if there are any parties with different administrator values
SELECT 
  administrator, 
  COUNT(*) as party_count
FROM public.parties 
GROUP BY administrator
ORDER BY party_count DESC;

-- 5. If you need to update existing parties to use the correct admin email
-- (Uncomment and replace 'pauly@gmail.com' with your actual admin email)
-- UPDATE public.parties 
-- SET administrator = 'pauly@gmail.com' 
-- WHERE administrator != 'pauly@gmail.com';
