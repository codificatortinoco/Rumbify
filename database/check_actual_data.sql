-- Check what's actually in the database
-- Run this in your Supabase SQL Editor

-- 1. See all parties and their administrator field
SELECT 
  id, 
  title, 
  administrator, 
  created_at,
  category
FROM public.parties 
ORDER BY created_at DESC
LIMIT 10;

-- 2. See what admin users exist
SELECT 
  id, 
  name, 
  email, 
  is_admin
FROM public.users 
WHERE is_admin = true;

-- 3. Count parties by administrator
SELECT 
  administrator, 
  COUNT(*) as party_count
FROM public.parties 
GROUP BY administrator
ORDER BY party_count DESC;
