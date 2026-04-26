/*
  # Add Extra Fields for Replacement, Incidents, and Maintenance

  1. Purpose
    - Support new UI workflows for replacement requests, incident coverage, and maintenance.

  2. Changes
    - replacement_requests: add `agreement_id` (uuid) and `new_vehicle_id` (uuid)
    - incidents: add `city` (text), `accident_place` (text), `notes` (text), `attachments` (jsonb)
    - maintenance_schedules: add `attachments` (jsonb)

  3. Notes
    - All columns are nullable with sensible defaults.
    - Existing data remains untouched.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='replacement_requests' AND column_name='agreement_id') THEN
    ALTER TABLE replacement_requests ADD COLUMN agreement_id uuid REFERENCES agreements(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='replacement_requests' AND column_name='new_vehicle_id') THEN
    ALTER TABLE replacement_requests ADD COLUMN new_vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='city') THEN
    ALTER TABLE incidents ADD COLUMN city text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='accident_place') THEN
    ALTER TABLE incidents ADD COLUMN accident_place text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='notes') THEN
    ALTER TABLE incidents ADD COLUMN notes text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='attachments') THEN
    ALTER TABLE incidents ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maintenance_schedules' AND column_name='attachments') THEN
    ALTER TABLE maintenance_schedules ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
