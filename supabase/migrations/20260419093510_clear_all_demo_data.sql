/*
  # Clear All Demo Data

  Removes all seeded/demo data from every table in the system.
  Tables are cleared in dependency order to respect foreign key constraints.

  1. Tables cleared (in order):
    - `invoices` - billing records
    - `agreement_extensions` - extension requests
    - `agreements` - lease agreements
    - `quotations` - quotation records
    - `vehicle_requests` - vehicle request records
    - `incidents` - incident records
    - `driver_replacements` - driver change records
    - `replacement_requests` - replacement request records
    - `maintenance_schedules` - maintenance records
    - `vehicles` - all fleet vehicles

  2. Important Notes
    - All tables are truncated via DELETE to respect RLS
    - No schema changes are made
*/

DELETE FROM invoices;
DELETE FROM agreement_extensions;
DELETE FROM agreements;
DELETE FROM quotations;
DELETE FROM vehicle_requests;
DELETE FROM incidents;
DELETE FROM driver_replacements;
DELETE FROM replacement_requests;
DELETE FROM maintenance_schedules;
DELETE FROM vehicles;