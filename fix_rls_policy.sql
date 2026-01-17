-- Fix RLS policy for users table to allow registration
-- Run this in Supabase SQL Editor

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new policy - allow authenticated users to insert their own profile
-- OR allow service role (for triggers)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also create a policy for anon users during registration
-- This allows the insert right after signUp before session is fully established
CREATE POLICY "Allow insert during registration" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Better approach: Create a trigger to auto-create user profile
-- This runs with SECURITY DEFINER so it bypasses RLS

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
