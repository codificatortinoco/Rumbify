-- Create descriptions table for party descriptions
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.descriptions (
    id BIGSERIAL PRIMARY KEY,
    party_id BIGINT NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_descriptions_party_id ON public.descriptions(party_id);

-- Enable Row Level Security
ALTER TABLE public.descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for descriptions table
CREATE POLICY "Enable read access for all users" ON public.descriptions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.descriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.descriptions FOR UPDATE USING (true);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_descriptions_updated_at BEFORE UPDATE ON public.descriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
