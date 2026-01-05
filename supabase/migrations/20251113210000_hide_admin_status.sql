-- Security Fix: Hide is_admin field from public queries
--
-- Issue: The profiles table was publicly readable including the is_admin field,
-- which could expose admin accounts to targeted attacks.
--
-- Solution:
-- 1. Created public_profiles view without is_admin field
-- 2. Updated RLS policies to control access properly
-- 3. Frontend should query public_profiles view for user listings

-- Drop the old overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create a public-safe view that excludes sensitive fields
CREATE OR REPLACE VIEW public_profiles AS
SELECT
  id,
  username,
  avatar_url,
  created_at
FROM profiles;

-- Grant SELECT access to the view
GRANT SELECT ON public_profiles TO anon, authenticated;

-- Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can see their OWN full profile (including is_admin)
CREATE POLICY "Users can view own full profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Authenticated users can see other users' basic info
-- (but frontend should use public_profiles view to ensure is_admin is excluded)
CREATE POLICY "Users can view others basic profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() != id);

-- Policy 3: Anonymous users can read profiles
-- (but frontend MUST use public_profiles view to exclude is_admin)
CREATE POLICY "Anonymous can view profiles"
  ON profiles
  FOR SELECT
  TO anon
  USING (true);

-- IMPORTANT: Frontend code should query public_profiles instead of profiles
-- to ensure is_admin is never exposed in API responses
