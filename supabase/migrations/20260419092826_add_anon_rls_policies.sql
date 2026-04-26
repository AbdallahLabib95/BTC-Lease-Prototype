/*
  # Add anon access RLS policies

  The application uses a client-side session (sessionStorage) rather than Supabase Auth.
  All database queries use the anon key without an authenticated session, so the existing
  RLS policies (which require `auth.uid() IS NOT NULL`) block all access.

  This migration adds policies for the `anon` role on all tables so the app can
  read and write data.

  1. Security Changes
    - Add SELECT, INSERT, UPDATE, DELETE policies for `anon` role on:
      - vehicles
      - maintenance_schedules
      - replacement_requests
      - driver_replacements
      - incidents
      - vehicle_requests
      - agreements
      - agreement_extensions
      - quotations
      - invoices
*/

-- vehicles
CREATE POLICY "Anon users can view vehicles"
  ON vehicles FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert vehicles"
  ON vehicles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update vehicles"
  ON vehicles FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete vehicles"
  ON vehicles FOR DELETE TO anon USING (true);

-- maintenance_schedules
CREATE POLICY "Anon users can view maintenance"
  ON maintenance_schedules FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert maintenance"
  ON maintenance_schedules FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update maintenance"
  ON maintenance_schedules FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete maintenance"
  ON maintenance_schedules FOR DELETE TO anon USING (true);

-- replacement_requests
CREATE POLICY "Anon users can view replacement requests"
  ON replacement_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert replacement requests"
  ON replacement_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update replacement requests"
  ON replacement_requests FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete replacement requests"
  ON replacement_requests FOR DELETE TO anon USING (true);

-- driver_replacements
CREATE POLICY "Anon users can view driver replacements"
  ON driver_replacements FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert driver replacements"
  ON driver_replacements FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update driver replacements"
  ON driver_replacements FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete driver replacements"
  ON driver_replacements FOR DELETE TO anon USING (true);

-- incidents
CREATE POLICY "Anon users can view incidents"
  ON incidents FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert incidents"
  ON incidents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update incidents"
  ON incidents FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete incidents"
  ON incidents FOR DELETE TO anon USING (true);

-- vehicle_requests
CREATE POLICY "Anon users can view vehicle requests"
  ON vehicle_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert vehicle requests"
  ON vehicle_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update vehicle requests"
  ON vehicle_requests FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete vehicle requests"
  ON vehicle_requests FOR DELETE TO anon USING (true);

-- agreements
CREATE POLICY "Anon users can view agreements"
  ON agreements FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert agreements"
  ON agreements FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update agreements"
  ON agreements FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete agreements"
  ON agreements FOR DELETE TO anon USING (true);

-- agreement_extensions
CREATE POLICY "Anon users can view agreement extensions"
  ON agreement_extensions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert agreement extensions"
  ON agreement_extensions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update agreement extensions"
  ON agreement_extensions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete agreement extensions"
  ON agreement_extensions FOR DELETE TO anon USING (true);

-- quotations
CREATE POLICY "Anon users can view quotations"
  ON quotations FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert quotations"
  ON quotations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update quotations"
  ON quotations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete quotations"
  ON quotations FOR DELETE TO anon USING (true);

-- invoices
CREATE POLICY "Anon users can view invoices"
  ON invoices FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert invoices"
  ON invoices FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update invoices"
  ON invoices FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete invoices"
  ON invoices FOR DELETE TO anon USING (true);