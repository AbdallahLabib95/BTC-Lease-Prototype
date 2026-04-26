/*
  # Create Quotation-Vehicles Linking Table

  1. New Tables
    - `quotation_vehicles`
      - `id` (uuid, primary key)
      - `quotation_id` (uuid, foreign key to quotations)
      - `vehicle_id` (uuid, foreign key to vehicles)
      - `quantity` (integer, default 1)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `quotation_vehicles` table
    - Add policies for anon access (matching existing app pattern)

  3. Important Notes
    - Links quotations to their associated vehicles
    - Allows multiple vehicles per quotation
*/

CREATE TABLE IF NOT EXISTS quotation_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quotation_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select quotation_vehicles"
  ON quotation_vehicles FOR SELECT TO anon
  USING (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_vehicles.quotation_id)
  );

CREATE POLICY "Allow anon insert quotation_vehicles"
  ON quotation_vehicles FOR INSERT TO anon
  WITH CHECK (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_vehicles.quotation_id)
  );

CREATE POLICY "Allow anon delete quotation_vehicles"
  ON quotation_vehicles FOR DELETE TO anon
  USING (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_vehicles.quotation_id)
  );