-- Add party_history column to users table
-- Run this in your Supabase SQL Editor

-- 1. Add party_history column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS party_history JSONB DEFAULT '[]'::jsonb;

-- 2. Add comment to explain the column
COMMENT ON COLUMN public.users.party_history IS 'Array of party history entries for the user';

-- 3. Create index for better performance on party_history queries
CREATE INDEX IF NOT EXISTS idx_users_party_history ON public.users USING GIN (party_history);

-- 4. Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'party_history';

-- 5. Test insert/update operation
-- This is just a test to make sure the column works
UPDATE public.users 
SET party_history = '[]'::jsonb 
WHERE party_history IS NULL;

-- 6. Verify the update worked
SELECT 
  'Column added successfully' as status,
  COUNT(*) as users_with_party_history
FROM public.users 
WHERE party_history IS NOT NULL;
