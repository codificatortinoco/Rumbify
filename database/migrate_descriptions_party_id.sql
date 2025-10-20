-- Ensure descriptions table has party_id FK and proper policies
-- Run this in your Supabase SQL Editor (copy/paste the full script)

-- 1) Add party_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='descriptions' AND column_name='party_id'
  ) THEN
    ALTER TABLE public.descriptions ADD COLUMN party_id BIGINT;
  END IF;
END $$;

-- 2) Add foreign key constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'descriptions_party_fk'
  ) THEN
    ALTER TABLE public.descriptions
      ADD CONSTRAINT descriptions_party_fk
      FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3) Create index for better performance
CREATE INDEX IF NOT EXISTS idx_descriptions_party_id ON public.descriptions(party_id);

-- 4) Enable RLS and policies (idempotent)
ALTER TABLE public.descriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename='descriptions' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.descriptions FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename='descriptions' AND policyname='Enable insert for all users'
  ) THEN
    CREATE POLICY "Enable insert for all users" ON public.descriptions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename='descriptions' AND policyname='Enable update for all users'
  ) THEN
    CREATE POLICY "Enable update for all users" ON public.descriptions FOR UPDATE USING (true);
  END IF;
END $$;

-- 5) Verify structure and policies
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema='public' AND table_name='descriptions'
ORDER BY ordinal_position;

SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename='descriptions';