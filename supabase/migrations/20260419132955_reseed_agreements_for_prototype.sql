/*
  # Reseed Agreements for Prototype Demo

  Replaces the agreements data with prototype entries matching the client's
  target UI (card layout with Agreement No., Plate Number, PickupDate,
  Return Date, Driver Name, Status and Purchase Order Number).

  Extra fields (driver name, plate number, make, model, project, PO) are stored
  as JSON inside the existing `terms` text column so the schema is preserved.
*/

DELETE FROM agreement_extensions;
DELETE FROM invoices;
DELETE FROM agreements;

INSERT INTO agreements (agreement_number, client_name, start_date, end_date, monthly_rate, status, terms) VALUES
('10044', 'Project Alpha', DATE '2025-05-06', DATE '2028-01-15', 4800, 'open', '{"make":"Hyundai","model":"H-1 Starex","plate":"6141 - H O P","driver":"Test driver 1234","po":""}'),
('10041', 'Project Alpha', DATE '2025-01-15', DATE '2026-01-15', 5200, 'open', '{"make":"Jeep","model":"Grand Cherokee","plate":"3577 - B","driver":"Test driver 1234","po":""}'),
('10040', 'Project Beta', DATE '2024-11-20', DATE '2026-11-20', 3100, 'open', '{"make":"Kia","model":"Optima","plate":"4582 - K L M","driver":"Ahmed Saleh","po":""}'),
('10039', 'Project Gamma', DATE '2024-09-12', DATE '2025-09-12', 6200, 'closed', '{"make":"Toyota","model":"C-HR","plate":"7891 - T O Y","driver":"Khalid Omar","po":"PO-2024-088"}'),
('10038', 'Project Alpha', DATE '2025-03-01', DATE '2027-03-01', 5800, 'open', '{"make":"Nissan","model":"Patrol","plate":"2145 - N I S","driver":"Fahad Al-Otaibi","po":"PO-2025-012"}'),
('10037', 'Project Delta', DATE '2024-07-18', DATE '2025-07-18', 4200, 'open', '{"make":"Toyota","model":"Camry","plate":"9034 - C A M","driver":"Saud Al-Shammari","po":""}'),
('10036', 'Project Alpha', DATE '2025-02-05', DATE '2026-02-05', 7200, 'open', '{"make":"Mercedes","model":"E-Class","plate":"1207 - M E R","driver":"Mohammed Al-Harbi","po":"PO-2025-005"}'),
('10035', 'Project Beta', DATE '2024-12-22', DATE '2025-12-22', 5500, 'open', '{"make":"Ford","model":"Explorer","plate":"6623 - F R D","driver":"Abdulrahman Al-Qahtani","po":""}');

INSERT INTO invoices (invoice_number, client_name, amount, tax_amount, total_amount, due_date, status, issued_date, paid_date) VALUES
('INV-2025-101', 'Project Alpha', 4800, 720, 5520, DATE '2025-05-01', 'paid', DATE '2025-04-01', DATE '2025-04-25'),
('INV-2025-102', 'Project Alpha', 5200, 780, 5980, DATE '2025-05-05', 'pending', DATE '2025-04-05', NULL),
('INV-2025-103', 'Project Beta', 3100, 465, 3565, DATE '2025-05-10', 'pending', DATE '2025-04-10', NULL),
('INV-2025-104', 'Project Alpha', 7200, 1080, 8280, DATE '2025-04-20', 'overdue', DATE '2025-03-20', NULL),
('INV-2024-099', 'Project Gamma', 6200, 930, 7130, DATE '2024-10-15', 'paid', DATE '2024-09-15', DATE '2024-10-10');

WITH a AS (SELECT id, agreement_number FROM agreements)
INSERT INTO agreement_extensions (agreement_id, requested_end_date, reason, status, new_monthly_rate)
SELECT a.id, DATE '2029-01-15', 'Extending project coverage', 'pending', 5000 FROM a WHERE agreement_number='10044'
UNION ALL
SELECT a.id, DATE '2027-01-15', 'Extension requested by client', 'approved', 5500 FROM a WHERE agreement_number='10041';
