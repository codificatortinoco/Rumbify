-- Patch RLS policies to allow inserts/updates on parties, prices, and descriptions
-- Run this in your Supabase SQL Editor (copy/paste the full script)

-- Parties
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='parties' AND policyname='Enable read access for all users') THEN
    CREATE POLICY "Enable read access for all users" ON public.parties FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='parties' AND policyname='Enable insert for all users') THEN
    CREATE POLICY "Enable insert for all users" ON public.parties FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='parties' AND policyname='Enable update for all users') THEN
    CREATE POLICY "Enable update for all users" ON public.parties FOR UPDATE USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='parties' AND policyname='Enable delete for all users') THEN
    CREATE POLICY "Enable delete for all users" ON public.parties FOR DELETE USING (true);
  END IF;
END $$;

-- Prices
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prices' AND policyname='Enable read access for all users') THEN
    CREATE POLICY "Enable read access for all users" ON public.prices FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prices' AND policyname='Enable insert for all users') THEN
    CREATE POLICY "Enable insert for all users" ON public.prices FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prices' AND policyname='Enable update for all users') THEN
    CREATE POLICY "Enable update for all users" ON public.prices FOR UPDATE USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prices' AND policyname='Enable delete for all users') THEN
    CREATE POLICY "Enable delete for all users" ON public.prices FOR DELETE USING (true);
  END IF;
END $$;

-- Descriptions (ensure RLS + policies, even if the table already exists)
ALTER TABLE public.descriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='descriptions' AND policyname='Enable read access for all users') THEN
    CREATE POLICY "Enable read access for all users" ON public.descriptions FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='descriptions' AND policyname='Enable insert for all users') THEN
    CREATE POLICY "Enable insert for all users" ON public.descriptions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='descriptions' AND policyname='Enable update for all users') THEN
    CREATE POLICY "Enable update for all users" ON public.descriptions FOR UPDATE USING (true);
  END IF;
END $$;

-- Verify
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('parties','prices','descriptions')
ORDER BY tablename, policyname;