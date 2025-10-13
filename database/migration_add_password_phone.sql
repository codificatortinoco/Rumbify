-- Migration to add missing columns to users table
-- Run this in your Supabase SQL Editor

-- Add password column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Add phone column if it doesn't exist  
ALTER TABLE IF NOT EXISTS public.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add other missing columns if they don't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_visible BOOLEAN DEFAULT TRUE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS attendance_visible BOOLEAN DEFAULT TRUE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add the missing policies for user creation and updates
CREATE POLICY IF NOT EXISTS "Enable insert for all users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update for all users" ON public.users FOR UPDATE USING (true);

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
