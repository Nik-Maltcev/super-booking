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
