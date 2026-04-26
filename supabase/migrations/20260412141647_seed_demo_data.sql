/*
  # Seed Demo Data

  Populates the database with sample data for demonstration:
  - 12 vehicles across different categories
  - 6 maintenance schedules
  - 4 replacement requests
  - 3 driver replacements
  - 5 incidents
  - 3 vehicle requests
  - 6 agreements
  - 3 agreement extensions
  - 4 quotations
  - 8 invoices
*/

INSERT INTO vehicles (plate_number, make, model, year, color, vin, status, mileage, fuel_type, category, daily_rate, assigned_driver) VALUES
  ('ABC-1234', 'Toyota', 'Camry', 2024, 'White', 'VIN001', 'rented', 15200, 'gasoline', 'sedan', 45.00, 'Ahmed Al-Rashid'),
  ('DEF-5678', 'Honda', 'CR-V', 2023, 'Black', 'VIN002', 'available', 28400, 'gasoline', 'suv', 65.00, ''),
  ('GHI-9012', 'Ford', 'F-150', 2024, 'Silver', 'VIN003', 'rented', 8900, 'diesel', 'truck', 80.00, 'Omar Hassan'),
  ('JKL-3456', 'Mercedes', 'E-Class', 2024, 'Gray', 'VIN004', 'maintenance', 42000, 'gasoline', 'sedan', 95.00, 'Khalid Nasser'),
  ('MNO-7890', 'Toyota', 'Hilux', 2023, 'White', 'VIN005', 'rented', 55000, 'diesel', 'truck', 70.00, 'Saeed Al-Fahd'),
  ('PQR-1357', 'Nissan', 'Patrol', 2024, 'Black', 'VIN006', 'available', 12000, 'gasoline', 'suv', 110.00, ''),
  ('STU-2468', 'Hyundai', 'Tucson', 2023, 'Blue', 'VIN007', 'rented', 31000, 'gasoline', 'suv', 55.00, 'Faisal Yousef'),
  ('VWX-3579', 'Toyota', 'Hiace', 2022, 'White', 'VIN008', 'available', 67000, 'diesel', 'van', 85.00, ''),
  ('YZA-4680', 'Kia', 'Sportage', 2024, 'Red', 'VIN009', 'available', 5000, 'gasoline', 'suv', 50.00, ''),
  ('BCD-5791', 'Chevrolet', 'Tahoe', 2023, 'White', 'VIN010', 'rented', 38000, 'gasoline', 'suv', 100.00, 'Nabil Saleh'),
  ('EFG-6802', 'Ford', 'Explorer', 2024, 'Gray', 'VIN011', 'maintenance', 21000, 'gasoline', 'suv', 75.00, 'Ali Mansour'),
  ('HIJ-7913', 'Toyota', 'Land Cruiser', 2024, 'Black', 'VIN012', 'rented', 9500, 'diesel', 'suv', 130.00, 'Tariq Hamdan')
ON CONFLICT (plate_number) DO NOTHING;

INSERT INTO maintenance_schedules (vehicle_id, maintenance_type, scheduled_date, status, notes, cost) VALUES
  ((SELECT id FROM vehicles WHERE plate_number = 'JKL-3456'), 'Replace Driver', '2026-04-15', 'scheduled', 'Regular 10K service', 150.00),
  ((SELECT id FROM vehicles WHERE plate_number = 'EFG-6802'), 'Accident', '2026-04-10', 'in_progress', 'Front brake pads replacement', 450.00),
  ((SELECT id FROM vehicles WHERE plate_number = 'MNO-7890'), 'Early Termination', '2026-04-20', 'scheduled', 'All four tires', 80.00),
  ((SELECT id FROM vehicles WHERE plate_number = 'VWX-3579'), 'Extend Agreement', '2026-04-25', 'scheduled', '50K km major service', 800.00),
  ((SELECT id FROM vehicles WHERE plate_number = 'ABC-1234'), 'Replacement', '2026-05-01', 'scheduled', 'AC compressor check', 300.00),
  ((SELECT id FROM vehicles WHERE plate_number = 'STU-2468'), 'Replacement', '2026-04-18', 'completed', 'Regular service completed', 120.00);

INSERT INTO replacement_requests (vehicle_id, reason, priority, status, requested_by, notes) VALUES
  ((SELECT id FROM vehicles WHERE plate_number = 'JKL-3456'), 'Engine performance issues', 'high', 'pending', 'Fleet Manager', 'Vehicle showing reduced performance'),
  ((SELECT id FROM vehicles WHERE plate_number = 'VWX-3579'), 'High mileage - end of life', 'medium', 'approved', 'Operations', 'Replace with newer model'),
  ((SELECT id FROM vehicles WHERE plate_number = 'MNO-7890'), 'Client requested upgrade', 'low', 'pending', 'Sales Team', 'Client wants SUV instead'),
  ((SELECT id FROM vehicles WHERE plate_number = 'EFG-6802'), 'Frequent breakdowns', 'urgent', 'pending', 'Fleet Manager', 'Vehicle has had 3 breakdowns this month');

INSERT INTO driver_replacements (vehicle_id, current_driver, new_driver, reason, status) VALUES
  ((SELECT id FROM vehicles WHERE plate_number = 'ABC-1234'), 'Ahmed Al-Rashid', 'Youssef Karim', 'Driver on leave', 'pending'),
  ((SELECT id FROM vehicles WHERE plate_number = 'GHI-9012'), 'Omar Hassan', 'Bilal Mahmoud', 'Driver reassignment', 'approved'),
  ((SELECT id FROM vehicles WHERE plate_number = 'BCD-5791'), 'Nabil Saleh', '', 'Driver resigned', 'pending');

INSERT INTO incidents (vehicle_id, incident_date, incident_type, description, severity, insurance_claim, claim_number, status, estimated_cost) VALUES
  ((SELECT id FROM vehicles WHERE plate_number = 'ABC-1234'), '2026-03-15', 'accident', 'Minor fender bender in parking lot', 'minor', true, 'CLM-2026-001', 'under_review', 2500.00),
  ((SELECT id FROM vehicles WHERE plate_number = 'GHI-9012'), '2026-03-20', 'damage', 'Windshield crack from road debris', 'minor', false, '', 'resolved', 800.00),
  ((SELECT id FROM vehicles WHERE plate_number = 'STU-2468'), '2026-04-01', 'accident', 'Side collision at intersection', 'moderate', true, 'CLM-2026-002', 'reported', 5500.00),
  ((SELECT id FROM vehicles WHERE plate_number = 'BCD-5791'), '2026-04-05', 'vandalism', 'Scratches on driver side', 'minor', false, '', 'reported', 1200.00),
  ((SELECT id FROM vehicles WHERE plate_number = 'HIJ-7913'), '2026-03-28', 'accident', 'Rear-end collision on highway', 'major', true, 'CLM-2026-003', 'under_review', 12000.00);

INSERT INTO vehicle_requests (requested_by, vehicle_type, purpose, quantity, preferred_make, preferred_model, budget, status, notes) VALUES
  ('Operations Dept', 'suv', 'Executive transport', 2, 'Toyota', 'Land Cruiser', 150000.00, 'pending', 'Needed for new client contract'),
  ('Sales Team', 'sedan', 'Sales fleet expansion', 5, 'Toyota', 'Camry', 175000.00, 'approved', 'Q2 expansion plan'),
  ('Logistics', 'van', 'Cargo delivery', 3, 'Toyota', 'Hiace', 120000.00, 'pending', 'New delivery routes');

INSERT INTO agreements (agreement_number, vehicle_id, client_name, start_date, end_date, monthly_rate, status, terms) VALUES
  ('AGR-2026-001', (SELECT id FROM vehicles WHERE plate_number = 'ABC-1234'), 'National Corp', '2026-01-01', '2026-12-31', 1350.00, 'active', '12-month lease with maintenance included'),
  ('AGR-2026-002', (SELECT id FROM vehicles WHERE plate_number = 'GHI-9012'), 'Gulf Trading LLC', '2026-02-01', '2027-01-31', 2400.00, 'active', '12-month lease'),
  ('AGR-2026-003', (SELECT id FROM vehicles WHERE plate_number = 'MNO-7890'), 'Desert Logistics', '2025-06-01', '2026-05-31', 2100.00, 'active', 'Monthly renewable'),
  ('AGR-2026-004', (SELECT id FROM vehicles WHERE plate_number = 'STU-2468'), 'Metro Services', '2026-03-01', '2026-08-31', 1650.00, 'active', '6-month lease'),
  ('AGR-2026-005', (SELECT id FROM vehicles WHERE plate_number = 'BCD-5791'), 'Royal Group', '2025-10-01', '2026-04-30', 3000.00, 'active', 'Premium package'),
  ('AGR-2026-006', (SELECT id FROM vehicles WHERE plate_number = 'HIJ-7913'), 'Al Fajr Holdings', '2026-01-15', '2027-01-14', 3900.00, 'active', 'Executive lease package');

INSERT INTO agreement_extensions (agreement_id, requested_end_date, reason, status, new_monthly_rate) VALUES
  ((SELECT id FROM agreements WHERE agreement_number = 'AGR-2026-003'), '2026-11-30', 'Project extension requires continued use', 'pending', 2100.00),
  ((SELECT id FROM agreements WHERE agreement_number = 'AGR-2026-005'), '2026-10-31', 'Client wishes to extend contract', 'approved', 2800.00),
  ((SELECT id FROM agreements WHERE agreement_number = 'AGR-2026-001'), '2027-06-30', 'Long-term partnership continuation', 'pending', 1300.00);

INSERT INTO quotations (quotation_number, client_name, vehicle_type, duration_months, quantity, estimated_rate, total_amount, status, notes) VALUES
  ('QOT-2026-001', 'Skyline Enterprises', 'suv', 12, 3, 2500.00, 90000.00, 'submitted', 'Fleet package requested'),
  ('QOT-2026-002', 'Palm Corp', 'sedan', 6, 10, 1200.00, 72000.00, 'draft', 'Bulk order for sales team'),
  ('QOT-2026-003', 'Golden Transport', 'truck', 24, 5, 2800.00, 336000.00, 'approved', 'Long-term logistics contract'),
  ('QOT-2026-004', 'City Motors', 'van', 12, 2, 2200.00, 52800.00, 'submitted', 'Delivery fleet');

INSERT INTO invoices (invoice_number, agreement_id, client_name, amount, tax_amount, total_amount, due_date, status, issued_date, paid_date) VALUES
  ('INV-2026-001', (SELECT id FROM agreements WHERE agreement_number = 'AGR-2026-001'), 'National Corp', 1350.00, 202.50, 1552.50, '2026-04-15', 'pending', '2026-04-01', NULL),
  ('INV-2026-002', (SELECT id FROM agreements WHERE agreement_number = 'AGR-2026-002'), 'Gulf Trading LLC', 2400.00, 360.00, 2760.00, '2026-04-15', 'paid', '2026-04-01', '2026-04-10'),
  ('INV-2026-003', (SELECT id FROM agreements WHERE agreement_number = 'AGR-2026-003'), 'Desert Logistics', 2100.00, 315.00, 2415.00, '2026-04-01', 'overdue', '2026-03-15', NULL),
  ('INV-2026-004', (SELECT id FROM agreements WHERE agreement_number = 'AGR-2026-004'), 'Metro Services', 1650.00, 247.50, 1897.50, '2026-04-20', 'pending', '2026-04-05', NULL),
  ('INV-2026-005', (SELECT id FROM agreements WHERE agreement_number = 'AGR-2026-005'), 'Royal Group', 3000.00, 450.00, 3450.00, '2026-03-31', 'overdue', '2026-03-15', NULL),
  ('INV-2026-006', (SELECT id FROM agreements WHERE agreement_number = 'AGR-2026-006'), 'Al Fajr Holdings', 3900.00, 585.00, 4485.00, '2026-04-15', 'paid', '2026-04-01', '2026-04-08'),
  ('INV-2026-007', (SELECT id FROM agreements WHERE agreement_number = 'AGR-2026-001'), 'National Corp', 1350.00, 202.50, 1552.50, '2026-03-15', 'paid', '2026-03-01', '2026-03-12'),
  ('INV-2026-008', (SELECT id FROM agreements WHERE agreement_number = 'AGR-2026-002'), 'Gulf Trading LLC', 2400.00, 360.00, 2760.00, '2026-03-15', 'paid', '2026-03-01', '2026-03-10');