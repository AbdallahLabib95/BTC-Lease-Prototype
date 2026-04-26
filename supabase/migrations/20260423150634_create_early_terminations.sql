/*
  # Create early_terminations table

  Root cause fixed:
  - The previous file was named `EarlyTermination.sql`, which does not follow the
    timestamped migration naming used by the rest of this project.
  - Because of that, the migration was likely never applied.
  - This migration creates the table and adds anon/authenticated policies so the
    client-side app can read/write with the anon key.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.early_terminations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES public.agreements(id) ON DELETE SET NULL,
  termination_date date,
  customer_name text DEFAULT '',
  project text DEFAULT '',
  note text DEFAULT '',
  attachment_name text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_early_terminations_agreement_id
  ON public.early_terminations (agreement_id);

CREATE INDEX IF NOT EXISTS idx_early_terminations_created_at
  ON public.early_terminations (created_at DESC);

ALTER TABLE public.early_terminations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'early_terminations'
      AND policyname = 'Anon users can view early terminations'
  ) THEN
    CREATE POLICY "Anon users can view early terminations"
      ON public.early_terminations FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'early_terminations'
      AND policyname = 'Anon users can insert early terminations'
  ) THEN
    CREATE POLICY "Anon users can insert early terminations"
      ON public.early_terminations FOR INSERT TO anon WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'early_terminations'
      AND policyname = 'Anon users can update early terminations'
  ) THEN
    CREATE POLICY "Anon users can update early terminations"
      ON public.early_terminations FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'early_terminations'
      AND policyname = 'Anon users can delete early terminations'
  ) THEN
    CREATE POLICY "Anon users can delete early terminations"
      ON public.early_terminations FOR DELETE TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'early_terminations'
      AND policyname = 'Authenticated users can view early terminations'
  ) THEN
    CREATE POLICY "Authenticated users can view early terminations"
      ON public.early_terminations FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'early_terminations'
      AND policyname = 'Authenticated users can insert early terminations'
  ) THEN
    CREATE POLICY "Authenticated users can insert early terminations"
      ON public.early_terminations FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'early_terminations'
      AND policyname = 'Authenticated users can update early terminations'
  ) THEN
    CREATE POLICY "Authenticated users can update early terminations"
      ON public.early_terminations FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'early_terminations'
      AND policyname = 'Authenticated users can delete early terminations'
  ) THEN
    CREATE POLICY "Authenticated users can delete early terminations"
      ON public.early_terminations FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
