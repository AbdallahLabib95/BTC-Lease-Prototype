/*
  # Create / Fix early_terminations table

  1. Purpose
    - Fix missing table error for early termination page
    - Ensure required columns exist

  2. Changes
    - Create public.early_terminations if missing
    - Add missing columns safely
    - Add primary key if missing
    - Add status check constraint if missing
    - Reload PostgREST schema cache

  3. Notes
    - Safe to run multiple times
    - Existing data remains untouched
    - Foreign key is intentionally skipped here to avoid type mismatch issues
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'early_terminations'
  ) THEN
    CREATE TABLE public.early_terminations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      agreement_id uuid,
      termination_date date,
      customer_name text DEFAULT '',
      project text DEFAULT '',
      note text DEFAULT '',
      attachment_name text DEFAULT '',
      status text DEFAULT 'pending',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'early_terminations'
      AND column_name = 'id'
  ) THEN
    ALTER TABLE public.early_terminations
    ADD COLUMN id uuid DEFAULT gen_random_uuid();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'early_terminations'
      AND column_name = 'agreement_id'
  ) THEN
    ALTER TABLE public.early_terminations
    ADD COLUMN agreement_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'early_terminations'
      AND column_name = 'termination_date'
  ) THEN
    ALTER TABLE public.early_terminations
    ADD COLUMN termination_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'early_terminations'
      AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE public.early_terminations
    ADD COLUMN customer_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'early_terminations'
      AND column_name = 'project'
  ) THEN
    ALTER TABLE public.early_terminations
    ADD COLUMN project text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'early_terminations'
      AND column_name = 'note'
  ) THEN
    ALTER TABLE public.early_terminations
    ADD COLUMN note text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'early_terminations'
      AND column_name = 'attachment_name'
  ) THEN
    ALTER TABLE public.early_terminations
    ADD COLUMN attachment_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'early_terminations'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.early_terminations
    ADD COLUMN status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'early_terminations'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.early_terminations
    ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'early_terminations'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.early_terminations
    ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'early_terminations'
      AND c.contype = 'p'
  ) THEN
    ALTER TABLE public.early_terminations
    ADD CONSTRAINT early_terminations_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'early_terminations'
      AND c.conname = 'early_terminations_status_check'
  ) THEN
    ALTER TABLE public.early_terminations
    ADD CONSTRAINT early_terminations_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_early_terminations_agreement_id
  ON public.early_terminations (agreement_id);

CREATE INDEX IF NOT EXISTS idx_early_terminations_created_at
  ON public.early_terminations (created_at DESC);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.early_terminations TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';