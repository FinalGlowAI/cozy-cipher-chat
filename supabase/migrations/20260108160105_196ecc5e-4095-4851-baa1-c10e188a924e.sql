-- Create a security definer function to get user sessions without exposing session_id
CREATE OR REPLACE FUNCTION public.get_user_sessions(_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  created_at timestamp with time zone,
  last_active timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, user_id, created_at, last_active
  FROM public.active_sessions
  WHERE active_sessions.user_id = _user_id
$$;

-- Drop existing SELECT policy that exposes session_id
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.active_sessions;

-- Create new SELECT policy that returns false (no direct SELECT access)
-- Users should use the get_user_sessions function instead
CREATE POLICY "Users cannot directly select sessions"
ON public.active_sessions
FOR SELECT
USING (false);