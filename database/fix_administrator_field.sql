-- Fix script to update existing parties with correct administrator
-- Run this in your Supabase SQL Editor

-- IMPORTANT: Replace 'pauly@gmail.com' with your actual admin email!

-- 1. First, check what needs to be fixed
SELECT 
  id, 
  title, 
  administrator,
  CASE 
    WHEN administrator = 'pauly@gmail.com' THEN '✅ Correct'
    ELSE '❌ Needs fixing'
  END as status
FROM public.parties 
ORDER BY created_at DESC;

-- 2. Update all parties to use the correct admin email
-- (Uncomment the line below and replace 'pauly@gmail.com' with your actual admin email)
-- UPDATE public.parties 
-- SET administrator = 'pauly@gmail.com' 
-- WHERE administrator != 'pauly@gmail.com';

-- 3. Verify the fix worked
-- SELECT 
--   administrator, 
--   COUNT(*) as party_count
-- FROM public.parties 
-- GROUP BY administrator;
