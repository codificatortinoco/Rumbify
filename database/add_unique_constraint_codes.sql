-- Add unique constraint to codes table to ensure database-level uniqueness
-- Run this in your Supabase SQL Editor

-- First, check if there are any duplicate codes
SELECT code, COUNT(*) as count
FROM public.codes 
GROUP BY code 
HAVING COUNT(*) > 1;

-- If there are duplicates, you can clean them up first:
-- DELETE FROM public.codes 
-- WHERE id NOT IN (
--   SELECT MIN(id) 
--   FROM public.codes 
--   GROUP BY code
-- );

-- Add unique constraint to the code column
ALTER TABLE public.codes 
ADD CONSTRAINT codes_code_unique UNIQUE (code);

-- Verify the constraint was added
SELECT 
  constraint_name, 
  constraint_type, 
  table_name, 
  column_name
FROM information_schema.table_constraints 
WHERE table_name = 'codes' 
AND constraint_type = 'UNIQUE';
