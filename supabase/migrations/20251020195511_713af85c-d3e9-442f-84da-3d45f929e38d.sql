-- Insert admin roles for the specified emails
-- First, we need to get the user IDs from auth.users and insert them into user_roles

-- Note: This migration will only work if these users have already signed up
-- If they haven't signed up yet, the migration will complete but the inserts will be skipped

DO $$
DECLARE
  weehab_user_id uuid;
  jeanne_user_id uuid;
BEGIN
  -- Get user ID for weehab.community@gmail.com
  SELECT id INTO weehab_user_id
  FROM auth.users
  WHERE email = 'weehab.community@gmail.com';

  -- Get user ID for jeannedarkchatelain@gmail.com
  SELECT id INTO jeanne_user_id
  FROM auth.users
  WHERE email = 'jeannedarkchatelain@gmail.com';

  -- Insert admin role for weehab if user exists
  IF weehab_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (weehab_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Insert admin role for jeanne if user exists
  IF jeanne_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (jeanne_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;