/*
  # Reseed agreements with distinct dummy data

  Replaces previous agreement dummy data with fresh dummy records so the
  Agreements page shows different sample data (not the exact values from
  the reference image). Supports the green theme prototype UI.

  1. Changes
    - Remove all existing agreement_extensions, invoices, agreements rows
    - Insert 8 new dummy agreements with JSON metadata stored in `terms`
      column (make, model, plate, driver, po). Various statuses.
  2. Security
    - RLS unchanged; already enabled with anon read policies.
*/

DELETE FROM agreement_extensions;
DELETE FROM invoices;
DELETE FROM agreements;

INSERT INTO agreements (agreement_number, client_name, status, start_date, end_date, monthly_rate, terms)
SELECT * FROM (VALUES
  ('20011', 'Aurora Logistics Co.', 'open',   DATE '2025-03-10', DATE '2026-09-30', 3200, '{"make":"Toyota","model":"Camry","plate":"8821 - T A R","driver":"Ahmed Salim","po":"PO-5520"}'),
  ('20012', 'Crescent Trading',     'open',   DATE '2025-04-01', DATE '2026-04-01', 4100, '{"make":"Nissan","model":"Patrol","plate":"3349 - N K P","driver":"Yousef Farid","po":""}'),
  ('20013', 'Dune Industries',      'closed', DATE '2024-06-15', DATE '2025-06-15', 2900, '{"make":"Chevrolet","model":"Tahoe","plate":"7712 - C B M","driver":"Sami Rashid","po":"PO-5601"}'),
  ('20014', 'Gulf Petro Services',  'open',   DATE '2025-05-20', DATE '2027-05-20', 5200, '{"make":"Ford","model":"Explorer","plate":"5528 - F L X","driver":"Omar Khaled","po":"PO-5712"}'),
  ('20015', 'Oasis Construction',   'open',   DATE '2025-01-12', DATE '2026-01-12', 3400, '{"make":"Kia","model":"Sorento","plate":"4461 - K O R","driver":"Naif Hamad","po":""}'),
  ('20016', 'Palm Holdings',        'closed', DATE '2024-08-01', DATE '2025-08-01', 2700, '{"make":"Hyundai","model":"Sonata","plate":"1145 - H S N","driver":"Faisal Noor","po":"PO-5498"}'),
  ('20017', 'Red Sand Shipping',    'open',   DATE '2025-02-05', DATE '2026-08-05', 3800, '{"make":"GMC","model":"Yukon","plate":"9903 - G Y K","driver":"Tarek Hilal","po":"PO-5830"}'),
  ('20018', 'Sapphire Group',       'open',   DATE '2025-06-22', DATE '2026-12-22', 3100, '{"make":"Toyota","model":"Hilux","plate":"6074 - T H L","driver":"Majed Anwar","po":""}')
) AS t (agreement_number, client_name, status, start_date, end_date, monthly_rate, terms);
