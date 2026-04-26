/*
  # Add Damage Types to Incidents

  1. Purpose
    - Capture damage assessment checkboxes on incident reports.

  2. Changes
    - incidents: add `damage_types` jsonb column with default empty object

  3. Notes
    - Stores booleans: engine, chassis, transmission_box, can_be_repaired.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='damage_types') THEN
    ALTER TABLE incidents ADD COLUMN damage_types jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
