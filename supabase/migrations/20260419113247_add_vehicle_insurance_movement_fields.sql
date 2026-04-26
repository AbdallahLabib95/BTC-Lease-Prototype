/*
  # Add insurance and movement fields to vehicles

  1. Changes
    - Add `insurance` (numeric) to store insurance amount/reference
    - Add `movement_in` (date) to record when vehicle came in
    - Add `movement_out` (date) to record expected movement out date

  2. Notes
    - All fields optional, safe defaults
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'insurance') THEN
    ALTER TABLE vehicles ADD COLUMN insurance numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'movement_in') THEN
    ALTER TABLE vehicles ADD COLUMN movement_in date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'movement_out') THEN
    ALTER TABLE vehicles ADD COLUMN movement_out date;
  END IF;
END $$;
