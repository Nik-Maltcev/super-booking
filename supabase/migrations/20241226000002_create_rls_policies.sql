-- Migration: Create Row Level Security policies for Lawyer Booking System
-- Requirements: 15.3

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES (Fixed to avoid infinite recursion)
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow inserting own user profile during registration
-- Use auth.uid() = id OR allow if auth.uid() is not yet set (during signUp)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- LAWYERS TABLE POLICIES
-- ============================================

-- Anyone can view lawyers (public listing)
CREATE POLICY "Anyone can view lawyers" ON lawyers
  FOR SELECT
  USING (true);

-- Lawyers can update their own profile
CREATE POLICY "Lawyers can update own profile" ON lawyers
  FOR UPDATE
  USING (user_id = auth.uid());

-- Allow inserting own lawyer profile during registration
CREATE POLICY "Lawyers can insert own profile" ON lawyers
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- TIME_SLOTS TABLE POLICIES
-- ============================================

-- Anyone can view available time slots (for booking)
CREATE POLICY "Anyone can view available slots" ON time_slots
  FOR SELECT
  USING (is_available = true);

-- Lawyers can view all their own slots (including unavailable)
CREATE POLICY "Lawyers can view own slots" ON time_slots
  FOR SELECT
  USING (
    lawyer_id IN (
      SELECT id FROM lawyers WHERE user_id = auth.uid()
    )
  );

-- Lawyers can create their own time slots
CREATE POLICY "Lawyers can create own slots" ON time_slots
  FOR INSERT
  WITH CHECK (
    lawyer_id IN (
      SELECT id FROM lawyers WHERE user_id = auth.uid()
    )
  );

-- Lawyers can update their own time slots
CREATE POLICY "Lawyers can update own slots" ON time_slots
  FOR UPDATE
  USING (
    lawyer_id IN (
      SELECT id FROM lawyers WHERE user_id = auth.uid()
    )
  );

-- Lawyers can delete their own time slots
CREATE POLICY "Lawyers can delete own slots" ON time_slots
  FOR DELETE
  USING (
    lawyer_id IN (
      SELECT id FROM lawyers WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- APPOINTMENTS TABLE POLICIES
-- ============================================

-- Anyone can create appointments (public booking)
CREATE POLICY "Anyone can create appointments" ON appointments
  FOR INSERT
  WITH CHECK (true);

-- Anyone can view appointments (for confirmation page)
CREATE POLICY "Anyone can view appointments" ON appointments
  FOR SELECT
  USING (true);

-- Anyone can update appointments (for cancellation - simplified for MVP)
CREATE POLICY "Anyone can update appointments" ON appointments
  FOR UPDATE
  USING (true);

-- ============================================
-- HELPER FUNCTION: Update time slot availability on appointment creation
-- ============================================

CREATE OR REPLACE FUNCTION update_slot_availability_on_appointment()
RETURNS TRIGGER AS $
BEGIN
  -- When appointment is created, mark slot as unavailable
  IF TG_OP = 'INSERT' THEN
    UPDATE time_slots 
    SET is_available = false 
    WHERE id = NEW.time_slot_id;
  END IF;
  
  -- When appointment is cancelled, mark slot as available again
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE time_slots 
    SET is_available = true 
    WHERE id = NEW.time_slot_id;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic slot availability update
DROP TRIGGER IF EXISTS trigger_update_slot_availability ON appointments;
CREATE TRIGGER trigger_update_slot_availability
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_slot_availability_on_appointment();
