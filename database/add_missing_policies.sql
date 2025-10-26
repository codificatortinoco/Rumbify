-- Add missing RLS policies for parties and prices tables
-- Run this in your Supabase SQL Editor

-- Create policies for party creation and updates
CREATE POLICY IF NOT EXISTS "Enable insert for all users" ON public.parties FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update for all users" ON public.parties FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Enable delete for all users" ON public.parties FOR DELETE USING (true);

-- Create policies for prices creation and updates  
CREATE POLICY IF NOT EXISTS "Enable insert for all users" ON public.prices FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update for all users" ON public.prices FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Enable delete for all users" ON public.prices FOR DELETE USING (true);
