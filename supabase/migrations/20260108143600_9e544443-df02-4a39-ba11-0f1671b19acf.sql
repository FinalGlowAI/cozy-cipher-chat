-- Create security definer function for room lookup by code
CREATE OR REPLACE FUNCTION public.get_room_by_code(_room_code text)
RETURNS TABLE (
  id uuid,
  room_code text,
  created_by uuid,
  is_locked boolean,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, room_code, created_by, is_locked, expires_at, created_at
  FROM public.ephemeral_rooms
  WHERE room_code = _room_code
$$;

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view rooms" ON public.ephemeral_rooms;

-- Create new restricted SELECT policy - users can only see rooms they created or joined
CREATE POLICY "Users can only see rooms they created or joined"
ON public.ephemeral_rooms
FOR SELECT
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM public.room_participants
    WHERE room_participants.room_id = ephemeral_rooms.id
    AND room_participants.user_id = auth.uid()
  )
);