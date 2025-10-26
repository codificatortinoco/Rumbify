-- Script to reset codes for testing
-- Run this in your Supabase SQL Editor to reset codes and test again

-- 1. Reset the specific code ABC12345 to unused state
UPDATE public."Codes" 
SET already_used = false, user_id = NULL 
WHERE code = 'ABC12345';

-- 2. Verify the reset worked
SELECT 
  'Code reset status:' as info,
  id,
  code,
  party_id,
  price_id,
  already_used,
  user_id,
  created_at
FROM public."Codes" 
WHERE code = 'ABC12345';

-- 3. Show all codes for this party
SELECT 
  'All codes for party:' as info,
  id,
  code,
  party_id,
  price_id,
  already_used,
  user_id,
  created_at
FROM public."Codes" 
WHERE party_id = (SELECT party_id FROM public."Codes" WHERE code = 'ABC12345' LIMIT 1)
ORDER BY created_at DESC;

-- 4. Optional: Reset ALL codes (uncomment if needed)
-- UPDATE public."Codes" 
-- SET already_used = false, user_id = NULL 
-- WHERE already_used = true;
