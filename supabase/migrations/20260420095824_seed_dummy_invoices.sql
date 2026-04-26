/*
  # Seed Dummy Invoices Data

  1. Purpose
    - Populate the invoices table with realistic demo data tied to existing agreements.

  2. Changes
    - Inserts 12 dummy invoices with varied statuses (paid, pending, overdue)
    - Each invoice includes proper amount, tax (15% VAT), total, issued_date, due_date
    - Invoices are linked to existing agreements via client_name

  3. Notes
    - Uses INSERT with IF NOT EXISTS-style guard via invoice_number uniqueness
    - Safe to re-run: will skip duplicates
*/

DO $$
DECLARE
  ag RECORD;
  inv_num TEXT;
  base_amount NUMERIC;
  tax NUMERIC;
  total NUMERIC;
  counter INT := 1;
  statuses TEXT[] := ARRAY['paid', 'pending', 'overdue', 'paid', 'pending', 'paid'];
  s TEXT;
BEGIN
  FOR ag IN (SELECT id, client_name, agreement_number FROM agreements ORDER BY agreement_number LIMIT 8) LOOP
    -- First invoice per agreement
    inv_num := 'INV-2026-' || LPAD(counter::TEXT, 4, '0');
    base_amount := 5000 + (random() * 15000)::int;
    tax := ROUND(base_amount * 0.15, 2);
    total := base_amount + tax;
    s := statuses[1 + (counter % 6)];

    IF NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number = inv_num) THEN
      INSERT INTO invoices (invoice_number, agreement_id, client_name, amount, tax_amount, total_amount, issued_date, due_date, status, paid_date)
      VALUES (
        inv_num,
        ag.id,
        ag.client_name,
        base_amount,
        tax,
        total,
        CURRENT_DATE - (30 + counter * 5),
        CURRENT_DATE - (counter * 3),
        s,
        CASE WHEN s = 'paid' THEN CURRENT_DATE - (counter * 2) ELSE NULL END
      );
    END IF;
    counter := counter + 1;

    -- Second invoice per agreement for half of them
    IF counter % 2 = 0 THEN
      inv_num := 'INV-2026-' || LPAD(counter::TEXT, 4, '0');
      base_amount := 8000 + (random() * 12000)::int;
      tax := ROUND(base_amount * 0.15, 2);
      total := base_amount + tax;
      s := statuses[1 + ((counter + 2) % 6)];

      IF NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number = inv_num) THEN
        INSERT INTO invoices (invoice_number, agreement_id, client_name, amount, tax_amount, total_amount, issued_date, due_date, status, paid_date)
        VALUES (
          inv_num,
          ag.id,
          ag.client_name,
          base_amount,
          tax,
          total,
          CURRENT_DATE - (15 + counter * 2),
          CURRENT_DATE + (10 - counter),
          s,
          CASE WHEN s = 'paid' THEN CURRENT_DATE - counter ELSE NULL END
        );
      END IF;
      counter := counter + 1;
    END IF;
  END LOOP;
END $$;
