/*
  # Lease Car Rental System - Initial Schema

  1. New Tables
    - `vehicles` - Fleet inventory with status tracking
      - `id` (uuid, primary key)
      - `plate_number` (text, unique)
      - `make` (text) - manufacturer
      - `model` (text)
      - `year` (integer)
      - `color` (text)
      - `vin` (text)
      - `status` (text) - available, rented, maintenance, retired
      - `mileage` (integer)
      - `fuel_type` (text)
      - `category` (text) - sedan, SUV, truck, van
      - `daily_rate` (numeric)
      - `assigned_driver` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `maintenance_schedules` - Preventive maintenance planning
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid, FK to vehicles)
      - `maintenance_type` (text)
      - `scheduled_date` (date)
      - `status` (text) - scheduled, in_progress, completed, cancelled
      - `notes` (text)
      - `cost` (numeric)
      - `created_at` (timestamptz)

    - `replacement_requests` - Vehicle replacement requests
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid, FK to vehicles)
      - `reason` (text)
      - `priority` (text) - low, medium, high, urgent
      - `status` (text) - pending, approved, rejected, completed
      - `requested_by` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

    - `driver_replacements` - Driver change requests
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid, FK to vehicles)
      - `current_driver` (text)
      - `new_driver` (text)
      - `reason` (text)
      - `status` (text) - pending, approved, completed
      - `created_at` (timestamptz)

    - `incidents` - Accident/damage/insurance tracking
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid, FK to vehicles)
      - `incident_date` (date)
      - `incident_type` (text) - accident, damage, theft, vandalism
      - `description` (text)
      - `severity` (text) - minor, moderate, major
      - `insurance_claim` (boolean)
      - `claim_number` (text)
      - `status` (text) - reported, under_review, resolved, closed
      - `estimated_cost` (numeric)
      - `created_at` (timestamptz)

    - `vehicle_requests` - New vehicle requests
      - `id` (uuid, primary key)
      - `requested_by` (text)
      - `vehicle_type` (text)
      - `purpose` (text)
      - `quantity` (integer)
      - `preferred_make` (text)
      - `preferred_model` (text)
      - `budget` (numeric)
      - `status` (text) - pending, approved, rejected, fulfilled
      - `notes` (text)
      - `created_at` (timestamptz)

    - `agreements` - Lease/rental agreements
      - `id` (uuid, primary key)
      - `agreement_number` (text, unique)
      - `vehicle_id` (uuid, FK to vehicles)
      - `client_name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `monthly_rate` (numeric)
      - `status` (text) - active, expired, pending_extension, terminated
      - `terms` (text)
      - `created_at` (timestamptz)

    - `agreement_extensions` - Extension requests
      - `id` (uuid, primary key)
      - `agreement_id` (uuid, FK to agreements)
      - `requested_end_date` (date)
      - `reason` (text)
      - `status` (text) - pending, approved, rejected
      - `new_monthly_rate` (numeric)
      - `created_at` (timestamptz)

    - `quotations` - Price quotation requests
      - `id` (uuid, primary key)
      - `quotation_number` (text, unique)
      - `client_name` (text)
      - `vehicle_type` (text)
      - `duration_months` (integer)
      - `quantity` (integer)
      - `estimated_rate` (numeric)
      - `total_amount` (numeric)
      - `status` (text) - draft, submitted, approved, rejected
      - `notes` (text)
      - `created_at` (timestamptz)

    - `invoices` - Billing and payments
      - `id` (uuid, primary key)
      - `invoice_number` (text, unique)
      - `agreement_id` (uuid, FK to agreements)
      - `client_name` (text)
      - `amount` (numeric)
      - `tax_amount` (numeric)
      - `total_amount` (numeric)
      - `due_date` (date)
      - `status` (text) - pending, paid, overdue, cancelled
      - `issued_date` (date)
      - `paid_date` (date)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Policies allow authenticated users to manage their data
    - Service role has full access for edge functions
*/

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number text UNIQUE NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL DEFAULT 2024,
  color text NOT NULL DEFAULT '',
  vin text DEFAULT '',
  status text NOT NULL DEFAULT 'available',
  mileage integer DEFAULT 0,
  fuel_type text DEFAULT 'gasoline',
  category text DEFAULT 'sedan',
  daily_rate numeric DEFAULT 0,
  assigned_driver text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vehicles"
  ON vehicles FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update vehicles"
  ON vehicles FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete vehicles"
  ON vehicles FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Maintenance schedules
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL,
  scheduled_date date NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text DEFAULT '',
  cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view maintenance"
  ON maintenance_schedules FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert maintenance"
  ON maintenance_schedules FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update maintenance"
  ON maintenance_schedules FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete maintenance"
  ON maintenance_schedules FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Replacement requests
CREATE TABLE IF NOT EXISTS replacement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  requested_by text NOT NULL DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE replacement_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view replacement requests"
  ON replacement_requests FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert replacement requests"
  ON replacement_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update replacement requests"
  ON replacement_requests FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete replacement requests"
  ON replacement_requests FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Driver replacements
CREATE TABLE IF NOT EXISTS driver_replacements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  current_driver text NOT NULL DEFAULT '',
  new_driver text DEFAULT '',
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE driver_replacements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view driver replacements"
  ON driver_replacements FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert driver replacements"
  ON driver_replacements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update driver replacements"
  ON driver_replacements FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete driver replacements"
  ON driver_replacements FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  incident_date date NOT NULL DEFAULT CURRENT_DATE,
  incident_type text NOT NULL DEFAULT 'accident',
  description text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'minor',
  insurance_claim boolean DEFAULT false,
  claim_number text DEFAULT '',
  status text NOT NULL DEFAULT 'reported',
  estimated_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view incidents"
  ON incidents FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert incidents"
  ON incidents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update incidents"
  ON incidents FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete incidents"
  ON incidents FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Vehicle requests
CREATE TABLE IF NOT EXISTS vehicle_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by text NOT NULL DEFAULT '',
  vehicle_type text NOT NULL DEFAULT 'sedan',
  purpose text NOT NULL DEFAULT '',
  quantity integer DEFAULT 1,
  preferred_make text DEFAULT '',
  preferred_model text DEFAULT '',
  budget numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vehicle requests"
  ON vehicle_requests FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert vehicle requests"
  ON vehicle_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update vehicle requests"
  ON vehicle_requests FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete vehicle requests"
  ON vehicle_requests FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Agreements
CREATE TABLE IF NOT EXISTS agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_number text UNIQUE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_rate numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  terms text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view agreements"
  ON agreements FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert agreements"
  ON agreements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update agreements"
  ON agreements FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete agreements"
  ON agreements FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Agreement extensions
CREATE TABLE IF NOT EXISTS agreement_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements(id) ON DELETE CASCADE,
  requested_end_date date NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  new_monthly_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agreement_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view agreement extensions"
  ON agreement_extensions FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert agreement extensions"
  ON agreement_extensions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update agreement extensions"
  ON agreement_extensions FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete agreement extensions"
  ON agreement_extensions FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text UNIQUE NOT NULL,
  client_name text NOT NULL,
  vehicle_type text NOT NULL DEFAULT 'sedan',
  duration_months integer NOT NULL DEFAULT 12,
  quantity integer DEFAULT 1,
  estimated_rate numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view quotations"
  ON quotations FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert quotations"
  ON quotations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update quotations"
  ON quotations FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete quotations"
  ON quotations FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  agreement_id uuid REFERENCES agreements(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  issued_date date DEFAULT CURRENT_DATE,
  paid_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invoices"
  ON invoices FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update invoices"
  ON invoices FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete invoices"
  ON invoices FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);