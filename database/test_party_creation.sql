-- Test script to verify party creation works in Supabase
-- Run this in your Supabase SQL Editor to test the database setup

-- 1. Check if all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('parties', 'prices', 'descriptions', 'users')
ORDER BY table_name;

-- 2. Check if RLS policies exist for parties table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'parties' 
ORDER BY policyname;

-- 3. Check if RLS policies exist for prices table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'prices' 
ORDER BY policyname;

-- 4. Test inserting a party (this should work if everything is set up correctly)
INSERT INTO public.parties (title, attendees, location, date, administrator, image, tags, category)
VALUES ('Test Party', '0/50', 'Test Location', '2024-01-01 • 20:00-02:00', 'Test Admin', '', ARRAY['Test'], 'upcoming')
RETURNING id, title, created_at;

-- 5. Test inserting prices for the test party (replace PARTY_ID with the ID from step 4)
-- INSERT INTO public.prices (price_name, price, party_id)
-- VALUES ('General', '$25.000', PARTY_ID)
-- RETURNING id, price_name, price;

-- 6. Clean up test data (uncomment when ready to clean up)
-- DELETE FROM public.prices WHERE party_id = PARTY_ID;
-- DELETE FROM public.parties WHERE title = 'Test Party';
