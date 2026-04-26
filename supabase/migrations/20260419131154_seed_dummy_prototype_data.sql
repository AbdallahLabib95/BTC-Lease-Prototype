/*
  # Seed Dummy Prototype Data

  Seeds dummy data across all pages for demo purposes. No cross-page linking.
  Currency values are in SAR.
*/

DELETE FROM quotation_vehicles;
DELETE FROM agreement_extensions;
DELETE FROM invoices;
DELETE FROM agreements;
DELETE FROM incidents;
DELETE FROM driver_replacements;
DELETE FROM replacement_requests;
DELETE FROM maintenance_schedules;
DELETE FROM vehicle_requests;
DELETE FROM quotations;
DELETE FROM vehicles;

INSERT INTO vehicles (plate_number, make, model, year, color, category, fuel_type, status, mileage, daily_rate, insurance, movement_in, movement_out, image_url) VALUES
('ABC-1234', 'Toyota', 'Camry', 2024, 'White', 'sedan', 'gasoline', 'available', 15000, 220, 3500, '2024-01-15', NULL, 'https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&cs=tinysrgb&w=400'),
('ABC-2345', 'Toyota', 'Land Cruiser', 2025, 'Black', 'suv', 'gasoline', 'rented', 8500, 650, 6200, '2024-03-10', '2025-03-10', 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?auto=compress&cs=tinysrgb&w=400'),
('DEF-3456', 'Hyundai', 'Tucson', 2024, 'Silver', 'suv', 'gasoline', 'available', 22000, 280, 4100, '2024-02-20', NULL, 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?auto=compress&cs=tinysrgb&w=400'),
('GHI-4567', 'Nissan', 'Patrol', 2025, 'Gray', 'suv', 'gasoline', 'rented', 6200, 720, 7500, '2024-04-01', '2025-04-01', 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?auto=compress&cs=tinysrgb&w=400'),
('JKL-5678', 'Kia', 'Sportage', 2024, 'Blue', 'suv', 'gasoline', 'maintenance', 31000, 260, 3900, '2023-11-05', NULL, 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?auto=compress&cs=tinysrgb&w=400'),
('MNO-6789', 'BMW', '5 Series', 2025, 'Black', 'sedan', 'gasoline', 'available', 4100, 850, 8200, '2024-05-12', NULL, 'https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&cs=tinysrgb&w=400'),
('PQR-7890', 'Mercedes', 'E-Class', 2024, 'White', 'sedan', 'gasoline', 'rented', 18500, 920, 9100, '2024-01-20', '2025-01-20', 'https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&cs=tinysrgb&w=400'),
('STU-8901', 'Ford', 'F-150', 2024, 'Red', 'truck', 'gasoline', 'available', 12500, 400, 5200, '2024-02-08', NULL, 'https://images.pexels.com/photos/2533092/pexels-photo-2533092.jpeg?auto=compress&cs=tinysrgb&w=400'),
('VWX-9012', 'Toyota', 'Hiace', 2023, 'White', 'van', 'diesel', 'rented', 45000, 320, 4600, '2023-08-15', '2024-08-15', 'https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=400'),
('YZA-0123', 'Lexus', 'RX', 2025, 'Silver', 'suv', 'hybrid', 'available', 3200, 780, 7800, '2024-06-01', NULL, 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?auto=compress&cs=tinysrgb&w=400'),
('BCD-1357', 'Honda', 'Accord', 2024, 'Gray', 'sedan', 'gasoline', 'available', 11000, 240, 3700, '2024-03-22', NULL, 'https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&cs=tinysrgb&w=400'),
('EFG-2468', 'GMC', 'Yukon', 2024, 'Black', 'suv', 'gasoline', 'retired', 78000, 0, 0, '2022-05-10', '2024-07-30', 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?auto=compress&cs=tinysrgb&w=400');

WITH v AS (SELECT id, plate_number FROM vehicles)
INSERT INTO agreements (agreement_number, vehicle_id, client_name, start_date, end_date, monthly_rate, status, terms)
SELECT 'AGR-2025-001', v.id, 'Al Rajhi Capital', DATE '2025-01-10', DATE '2026-01-10', 18500, 'active', '12-month corporate lease' FROM v WHERE plate_number='ABC-2345'
UNION ALL
SELECT 'AGR-2025-002', v.id, 'SABIC Industries', DATE '2024-12-01', DATE '2025-12-01', 22000, 'active', '12-month lease with maintenance' FROM v WHERE plate_number='GHI-4567'
UNION ALL
SELECT 'AGR-2025-003', v.id, 'STC Group', DATE '2024-11-15', DATE '2025-11-15', 28000, 'active', 'Premium fleet lease' FROM v WHERE plate_number='PQR-7890'
UNION ALL
SELECT 'AGR-2024-012', v.id, 'Almarai Co.', DATE '2024-08-15', DATE '2025-08-15', 9600, 'expired', 'Standard lease' FROM v WHERE plate_number='VWX-9012';

WITH a AS (SELECT id, agreement_number, client_name FROM agreements)
INSERT INTO invoices (invoice_number, agreement_id, client_name, amount, tax_amount, total_amount, due_date, status, issued_date, paid_date)
SELECT 'INV-2025-001', a.id, a.client_name, 18500, 2775, 21275, DATE '2025-02-10', 'paid', DATE '2025-01-10', DATE '2025-02-05' FROM a WHERE agreement_number='AGR-2025-001'
UNION ALL
SELECT 'INV-2025-002', a.id, a.client_name, 22000, 3300, 25300, DATE '2025-02-15', 'paid', DATE '2025-01-15', DATE '2025-02-12' FROM a WHERE agreement_number='AGR-2025-002'
UNION ALL
SELECT 'INV-2025-003', a.id, a.client_name, 28000, 4200, 32200, DATE '2025-03-01', 'pending', DATE '2025-02-01', NULL FROM a WHERE agreement_number='AGR-2025-003'
UNION ALL
SELECT 'INV-2025-004', a.id, a.client_name, 18500, 2775, 21275, DATE '2025-03-10', 'overdue', DATE '2025-02-10', NULL FROM a WHERE agreement_number='AGR-2025-001'
UNION ALL
SELECT 'INV-2024-089', a.id, a.client_name, 9600, 1440, 11040, DATE '2024-09-15', 'paid', DATE '2024-08-15', DATE '2024-09-10' FROM a WHERE agreement_number='AGR-2024-012';

WITH v AS (SELECT id, plate_number FROM vehicles)
INSERT INTO maintenance_schedules (vehicle_id, maintenance_type, scheduled_date, status, notes, cost)
SELECT v.id, 'Oil Change', DATE '2025-05-10', 'scheduled', 'Regular 10,000 km service', 350 FROM v WHERE plate_number='JKL-5678'
UNION ALL
SELECT v.id, 'Tire Rotation', DATE '2025-05-15', 'scheduled', 'All four tires', 120 FROM v WHERE plate_number='ABC-1234'
UNION ALL
SELECT v.id, 'Brake Inspection', DATE '2025-04-28', 'completed', 'Passed inspection', 200 FROM v WHERE plate_number='DEF-3456'
UNION ALL
SELECT v.id, 'Full Service', DATE '2025-06-01', 'scheduled', 'Annual service', 1200 FROM v WHERE plate_number='MNO-6789';

WITH v AS (SELECT id, plate_number FROM vehicles)
INSERT INTO replacement_requests (vehicle_id, reason, priority, status, requested_by, notes)
SELECT v.id, 'Engine check light on', 'high', 'pending', 'Ahmed Al-Saud', 'Customer reports loss of power' FROM v WHERE plate_number='JKL-5678'
UNION ALL
SELECT v.id, 'AC not cooling', 'medium', 'approved', 'Fahad Al-Otaibi', 'Replacement vehicle requested' FROM v WHERE plate_number='ABC-2345';

WITH v AS (SELECT id, plate_number FROM vehicles)
INSERT INTO driver_replacements (vehicle_id, current_driver, new_driver, reason, status)
SELECT v.id, 'Mohammed Al-Harbi', 'Khalid Al-Dossari', 'Driver on leave', 'approved' FROM v WHERE plate_number='ABC-2345'
UNION ALL
SELECT v.id, 'Abdulrahman Al-Qahtani', 'Saud Al-Shammari', 'Reassignment', 'pending' FROM v WHERE plate_number='PQR-7890';

WITH v AS (SELECT id, plate_number FROM vehicles)
INSERT INTO incidents (vehicle_id, incident_date, incident_type, description, severity, insurance_claim, claim_number, status, estimated_cost)
SELECT v.id, DATE '2025-03-15', 'accident', 'Rear-end collision at traffic light', 'minor', true, 'CL-2025-0198', 'under_review', 3500 FROM v WHERE plate_number='DEF-3456'
UNION ALL
SELECT v.id, DATE '2025-02-20', 'damage', 'Side mirror broken', 'minor', false, '', 'resolved', 450 FROM v WHERE plate_number='BCD-1357';

INSERT INTO vehicle_requests (requested_by, vehicle_type, purpose, quantity, preferred_make, preferred_model, budget, status, notes) VALUES
('Operations Dept', 'suv', 'Executive fleet expansion', 3, 'Toyota', 'Land Cruiser', 2200000, 'pending', 'Required for Q2'),
('Logistics Dept', 'truck', 'Delivery operations', 5, 'Ford', 'F-150', 950000, 'approved', 'Budget approved'),
('Sales Team', 'sedan', 'Client visits', 2, 'Mercedes', 'C-Class', 650000, 'pending', 'Premium sedans');

WITH a AS (SELECT id, agreement_number FROM agreements)
INSERT INTO agreement_extensions (agreement_id, requested_end_date, reason, status, new_monthly_rate)
SELECT a.id, DATE '2026-07-10', 'Extending for additional 6 months', 'pending', 19200 FROM a WHERE agreement_number='AGR-2025-001'
UNION ALL
SELECT a.id, DATE '2026-06-01', 'Project extension', 'approved', 22500 FROM a WHERE agreement_number='AGR-2025-002';

INSERT INTO quotations (quotation_number, client_name, vehicle_type, duration_months, quantity, estimated_rate, total_amount, status, notes) VALUES
('QOT-2025-001', 'Saudi Aramco', 'sedan', 12, 5, 0, 0, 'approved', '{"email":"procurement@aramco.com","phone":"555123456","company":"Saudi Aramco","region":"dammam","city":"dammam","description":"Executive sedan fleet","vehicles":[{"manufacturer":"Toyota","model":"Camry","category":"sedan","subcategory":"standard","year":"2025","color":"White","quantity":5,"additions":["monthly_rental"],"rentType":["12"]}]}'),
('QOT-2025-002', 'NEOM Company', 'suv', 24, 10, 0, 0, 'under_processing', '{"email":"fleet@neom.com","phone":"555234567","company":"NEOM","region":"riyadh","city":"riyadh","description":"Project SUV fleet","vehicles":[{"manufacturer":"Toyota","model":"Land Cruiser","category":"suv","subcategory":"premium","year":"2025","color":"Black","quantity":10,"additions":["services_allowance"],"rentType":["24"]}]}'),
('QOT-2025-003', 'Ma''aden', 'truck', 36, 8, 0, 0, 'draft', '{"email":"ops@maaden.com.sa","phone":"555345678","company":"Ma''aden","region":"riyadh","city":"riyadh","description":"Mining site trucks","vehicles":[{"manufacturer":"Ford","model":"F-150","category":"truck","subcategory":"standard","year":"2024","color":"Silver","quantity":8,"additions":["daily_rental"],"rentType":["36"]}]}'),
('QOT-2025-004', 'PIF', 'sedan', 12, 3, 0, 0, 'sent_to_customer', '{"email":"admin@pif.gov.sa","phone":"555456789","company":"PIF","region":"riyadh","city":"riyadh","description":"Executive vehicles","vehicles":[{"manufacturer":"Mercedes","model":"S-Class","category":"sedan","subcategory":"luxury","year":"2025","color":"Black","quantity":3,"additions":["early_termination"],"rentType":["12"]}]}'),
('QOT-2024-099', 'Bupa Arabia', 'suv', 12, 4, 0, 0, 'rejected', '{"email":"fleet@bupa.com.sa","phone":"555567890","company":"Bupa Arabia","region":"jeddah","city":"jeddah","description":"Regional team vehicles","vehicles":[{"manufacturer":"Hyundai","model":"Tucson","category":"suv","subcategory":"standard","year":"2024","color":"Silver","quantity":4,"additions":["monthly_rental"],"rentType":["12"]}]}');
