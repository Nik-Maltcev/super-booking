-- Fix RLS policy and trigger for users table
-- Run this in Supabase SQL Editor

-- Drop the existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Allow insert during registration" ON users;

-- Create policy for authenticated users
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policy for anon users during registration
CREATE POLICY "Allow insert during registration" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function with ON CONFLICT to prevent duplicates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =====================================================
-- PAYMENT INTEGRATION FIX
-- Run this to add payment_id column and fix RLS
-- =====================================================

-- Add payment_id column to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Allow service role to update appointments (for Edge Function)
-- This is handled by service_role key which bypasses RLS


-- =====================================================
-- SIMPLE FIX: Allow anon users to update appointment status after payment
-- This is a simpler approach without Edge Functions
-- =====================================================

-- Allow anyone to update appointment status to 'confirmed' (for payment success page)
DROP POLICY IF EXISTS "Allow payment confirmation" ON appointments;
CREATE POLICY "Allow payment confirmation" ON appointments
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (status = 'confirmed');


-- =====================================================
-- ADD CONSULTATION PRICE TO LAWYERS
-- Each lawyer can have their own price
-- =====================================================

ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS consultation_price DECIMAL(10,2) DEFAULT 10.00;

-- Update existing lawyers with default price (you can change this later)
UPDATE lawyers SET consultation_price = 10.00 WHERE consultation_price IS NULL;


-- =====================================================
-- ADD CONSULTATION PRICE TO LAWYERS
-- =====================================================
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS consultation_price DECIMAL(10,2) DEFAULT 1000.00;


-- =====================================================
-- ADD TRANSACTION_ID TO APPOINTMENTS FOR PAYMENT TRACKING
-- =====================================================
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS transaction_id TEXT;


-- =====================================================
-- ALLOW ANON TO UPDATE TIME SLOTS (mark as unavailable after payment)
-- =====================================================
DROP POLICY IF EXISTS "Allow slot booking" ON time_slots;
CREATE POLICY "Allow slot booking" ON time_slots
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (is_available = false);


-- =====================================================
-- ALLOW ANON TO READ APPOINTMENTS AND RELATED DATA
-- =====================================================

-- Allow anyone to read appointments (for confirmation page)
DROP POLICY IF EXISTS "Anyone can read appointments" ON appointments;
CREATE POLICY "Anyone can read appointments" ON appointments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to read time slots
DROP POLICY IF EXISTS "Anyone can read time_slots" ON time_slots;
CREATE POLICY "Anyone can read time_slots" ON time_slots
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to read lawyers
DROP POLICY IF EXISTS "Anyone can read lawyers" ON lawyers;
CREATE POLICY "Anyone can read lawyers" ON lawyers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to read users (for lawyer names)
DROP POLICY IF EXISTS "Anyone can read users" ON users;
CREATE POLICY "Anyone can read users" ON users
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- =====================================================
-- REMOVE TRIGGER THAT BLOCKS SLOT ON APPOINTMENT CREATE
-- Slot should only be blocked after payment confirmation!
-- =====================================================
DROP TRIGGER IF EXISTS trigger_block_slot_on_appointment ON appointments;
DROP FUNCTION IF EXISTS block_slot_on_appointment();
