-- Quick test to check if parties exist and match admin email
-- Run this in your Supabase SQL Editor

-- 1. Check all parties in database
SELECT 
  id, 
  title, 
  administrator, 
  created_at,
  category
FROM public.parties 
ORDER BY created_at DESC;

-- 2. Check admin users
SELECT 
  id, 
  name, 
  email, 
  is_admin
FROM public.users 
WHERE is_admin = true;

-- 3. Test the exact query the backend uses
-- Replace 'pauly@gmail.com' with your actual admin email
SELECT 
  id, 
  title, 
  administrator, 
  created_at
FROM public.parties 
WHERE administrator = 'pauly@gmail.com'
ORDER BY created_at DESC;
