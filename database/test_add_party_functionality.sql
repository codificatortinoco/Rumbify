-- Test script to create sample codes and test the add party functionality
-- Run this in your Supabase SQL Editor after running the add_party_history_to_users.sql script

-- 1. First, let's create a sample party if it doesn't exist
INSERT INTO public.parties (title, attendees, location, date, administrator, image, tags, category)
VALUES (
  'Test Party for Codes',
  '0/50',
  'Test Location',
  '25/12/24 • 20:00-04:00',
  'Test Admin',
  'https://images.unsplash.com/photo-1571266028243-d220b6b0b8c5?w=400&h=200&fit=crop',
  ARRAY['Test', 'Sample'],
  'upcoming'
)
ON CONFLICT DO NOTHING;

-- 2. Get the party ID
WITH party_info AS (
  SELECT id FROM public.parties WHERE title = 'Test Party for Codes' LIMIT 1
)
INSERT INTO public.prices (price_name, price, party_id)
SELECT 'General', '$25.000', id FROM party_info
ON CONFLICT DO NOTHING;

-- 3. Create some test codes for the party
WITH party_info AS (
  SELECT p.id as party_id, pr.id as price_id 
  FROM public.parties p
  JOIN public.prices pr ON p.id = pr.party_id
  WHERE p.title = 'Test Party for Codes' 
  LIMIT 1
)
INSERT INTO public."Codes" (party_id, code, price_id, already_used)
SELECT 
  party_id,
  'TEST1234',
  price_id,
  false
FROM party_info
ON CONFLICT (code) DO NOTHING;

-- 4. Create another test code
WITH party_info AS (
  SELECT p.id as party_id, pr.id as price_id 
  FROM public.parties p
  JOIN public.prices pr ON p.id = pr.party_id
  WHERE p.title = 'Test Party for Codes' 
  LIMIT 1
)
INSERT INTO public."Codes" (party_id, code, price_id, already_used)
SELECT 
  party_id,
  'DEMO5678',
  price_id,
  false
FROM party_info
ON CONFLICT (code) DO NOTHING;

-- 5. Verify the codes were created
SELECT 
  'Test codes created' as status,
  c.id,
  c.code,
  c.party_id,
  c.price_id,
  c.already_used,
  p.title as party_title,
  pr.price_name,
  pr.price
FROM public."Codes" c
JOIN public.parties p ON c.party_id = p.id
JOIN public.prices pr ON c.price_id = pr.id
WHERE c.code IN ('TEST1234', 'DEMO5678');

-- 6. Test the party history functionality by adding a party to a user's history
-- First, let's get a user ID
WITH user_info AS (
  SELECT id FROM public.users LIMIT 1
),
party_info AS (
  SELECT p.id as party_id, pr.id as price_id 
  FROM public.parties p
  JOIN public.prices pr ON p.id = pr.party_id
  WHERE p.title = 'Test Party for Codes' 
  LIMIT 1
)
UPDATE public.users 
SET party_history = jsonb_build_array(
  jsonb_build_object(
    'party_id', pi.party_id,
    'title', 'Test Party for Codes',
    'location', 'Test Location',
    'date', '25/12/24 • 20:00-04:00',
    'administrator', 'Test Admin',
    'image', 'https://images.unsplash.com/photo-1571266028243-d220b6b0b8c5?w=400&h=200&fit=crop',
    'tags', '["Test", "Sample"]',
    'category', 'upcoming',
    'price_name', 'General',
    'price', '$25.000',
    'code_used', 'TEST1234',
    'added_at', NOW()::text,
    'status', 'attended'
  )
)
FROM user_info ui, party_info pi
WHERE users.id = ui.id;

-- 7. Verify the party history was added
SELECT 
  'Party history test' as status,
  id,
  name,
  party_history
FROM public.users 
WHERE party_history IS NOT NULL 
  AND jsonb_array_length(party_history) > 0;

-- 8. Clean up test data (uncomment if you want to remove test data)
/*
DELETE FROM public."Codes" WHERE code IN ('TEST1234', 'DEMO5678');
DELETE FROM public.prices WHERE price_name = 'General' AND price = '$25.000';
DELETE FROM public.parties WHERE title = 'Test Party for Codes';
UPDATE public.users SET party_history = '[]'::jsonb WHERE party_history IS NOT NULL;
*/
