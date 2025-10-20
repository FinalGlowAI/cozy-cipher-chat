-- Fix RLS policies for free_users table
-- Drop the problematic policy that tries to access auth.users
DROP POLICY IF EXISTS "Users can check if their email is a free user" ON public.free_users;

-- Create a corrected policy that uses auth.email() instead
CREATE POLICY "Users can check if their email is a free user"
ON public.free_users
FOR SELECT
TO authenticated
USING (email = auth.email());