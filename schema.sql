-- ============================================================
-- BarberBook – Supabase SQL Schema (v2 – dynamic slot booking)
-- If you already ran v1, run these drops first, then the rest:
--
--   DROP FUNCTION IF EXISTS book_slot CASCADE;
--   DROP TABLE IF EXISTS appointments CASCADE;
--   DROP TABLE IF EXISTS slots CASCADE;
--   DROP TABLE IF EXISTS services CASCADE;
--
-- Then run this whole file.
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────

CREATE TABLE services (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text        NOT NULL UNIQUE,
  duration_minutes integer     NOT NULL CHECK (duration_minutes > 0),
  created_at       timestamptz DEFAULT now()
);

-- slots = availability windows the admin opens per date
-- e.g. "available 17:00 – 22:00 on 2026-05-10"
CREATE TABLE slots (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  date       date        NOT NULL,
  open_from  time        NOT NULL,
  open_to    time        NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (date, open_from),
  CHECK (open_to > open_from)
);

-- appointments store their own start/end so multiple can live
-- inside one availability window without conflicting
CREATE TABLE appointments (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id       uuid        REFERENCES slots(id) ON DELETE SET NULL,
  service_id    uuid        REFERENCES services(id),
  date          date        NOT NULL,
  start_time    time        NOT NULL,
  end_time      time        NOT NULL,
  client_name   text        NOT NULL,
  client_email  text        NOT NULL,
  client_phone  text,
  notes         text,
  status        text        DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comment text,
  created_at    timestamptz DEFAULT now()
);

-- ── Default services ────────────────────────────────────────

INSERT INTO services (name, duration_minutes) VALUES
  ('Hair',         30),
  ('Beard',        20),
  ('Hair + Beard', 45);

-- ── Atomic booking RPC ──────────────────────────────────────
-- Runs as SECURITY DEFINER so the anon role can insert/check
-- without broad table-level UPDATE policies.

CREATE OR REPLACE FUNCTION book_slot(
  p_slot_id      uuid,
  p_service_id   uuid,
  p_date         date,
  p_start_time   time,
  p_end_time     time,
  p_client_name  text,
  p_client_email text,
  p_client_phone text,
  p_notes        text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot          slots%ROWTYPE;
  v_overlap_count integer;
  v_appointment   appointments%ROWTYPE;
BEGIN
  -- Lock the availability window row
  SELECT * INTO v_slot FROM slots WHERE id = p_slot_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Availability window not found';
  END IF;

  -- Requested time must fit inside the window
  IF p_start_time < v_slot.open_from OR p_end_time > v_slot.open_to THEN
    RAISE EXCEPTION 'Requested time is outside the availability window';
  END IF;

  -- Check for overlap with any pending or approved appointment on the same date
  SELECT COUNT(*) INTO v_overlap_count
  FROM appointments
  WHERE date       = p_date
    AND status    IN ('pending', 'approved')
    AND start_time <  p_end_time
    AND end_time   >  p_start_time;

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'This time has just been taken — please choose another slot';
  END IF;

  INSERT INTO appointments (
    slot_id, service_id, date, start_time, end_time,
    client_name, client_email, client_phone, notes
  ) VALUES (
    p_slot_id, p_service_id, p_date, p_start_time, p_end_time,
    p_client_name, p_client_email, p_client_phone, p_notes
  )
  RETURNING * INTO v_appointment;

  RETURN row_to_json(v_appointment);
END;
$$;

GRANT EXECUTE ON FUNCTION book_slot TO anon, authenticated;

-- ── Row Level Security ───────────────────────────────────────

ALTER TABLE services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- services
CREATE POLICY "services_public_read"  ON services FOR SELECT USING (true);
CREATE POLICY "services_admin_write"  ON services FOR ALL    USING (auth.role() = 'authenticated');

-- slots (availability windows)
CREATE POLICY "slots_public_read"    ON slots FOR SELECT USING (true);
CREATE POLICY "slots_admin_insert"   ON slots FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "slots_admin_update"   ON slots FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "slots_admin_delete"   ON slots FOR DELETE USING (auth.role() = 'authenticated');

-- appointments
CREATE POLICY "appointments_public_read"   ON appointments FOR SELECT USING (true);
CREATE POLICY "appointments_public_insert" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "appointments_admin_update"  ON appointments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "appointments_admin_delete"  ON appointments FOR DELETE USING (auth.role() = 'authenticated');
