-- Debug script to check party creation issues
-- Run this in your Supabase SQL Editor

-- 1. Check all parties in the database
SELECT id, title, administrator, created_at, category 
FROM public.parties 
ORDER BY created_at DESC;

-- 2. Check what admin users exist
SELECT id, name, email, is_admin 
FROM public.users 
WHERE is_admin = true;

-- 3. Check if there are any parties with administrator field matching admin emails
SELECT p.id, p.title, p.administrator, u.email as admin_email
FROM public.parties p
LEFT JOIN public.users u ON p.administrator = u.email
ORDER BY p.created_at DESC;

-- 4. If you need to fix existing parties, update them to use admin email
-- (Replace 'pauly@gmail.com' with your actual admin email)
-- UPDATE public.parties 
-- SET administrator = 'pauly@gmail.com' 
-- WHERE administrator != 'pauly@gmail.com' AND administrator IS NOT NULL;
