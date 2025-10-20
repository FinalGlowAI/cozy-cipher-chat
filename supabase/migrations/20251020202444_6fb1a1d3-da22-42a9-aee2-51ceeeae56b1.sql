-- Drop the problematic policy that exposes email data
DROP POLICY IF EXISTS "Users can check if their email is a free user" ON public.free_users;

-- Create a security definer function that safely checks if current user is a free user
-- Returns only a boolean, never exposes email addresses
CREATE OR REPLACE FUNCTION public.is_free_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.free_users
    WHERE email = auth.email()
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_free_user() TO authenticated;