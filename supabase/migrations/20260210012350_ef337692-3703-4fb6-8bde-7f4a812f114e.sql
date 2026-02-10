
-- Table to track kicked users per room
CREATE TABLE public.kicked_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.ephemeral_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kicked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

ALTER TABLE public.kicked_participants ENABLE ROW LEVEL SECURITY;

-- Room creators can view kicked participants
CREATE POLICY "Creators can view kicked participants"
ON public.kicked_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ephemeral_rooms
    WHERE ephemeral_rooms.id = kicked_participants.room_id
    AND ephemeral_rooms.created_by = auth.uid()
  )
);

-- Room creators can insert kicked participants
CREATE POLICY "Creators can kick participants"
ON public.kicked_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ephemeral_rooms
    WHERE ephemeral_rooms.id = kicked_participants.room_id
    AND ephemeral_rooms.created_by = auth.uid()
  )
);

-- Users can check if they themselves are kicked (needed for join check)
CREATE POLICY "Users can see own kick status"
ON public.kicked_participants FOR SELECT
USING (auth.uid() = user_id);

-- Update room_participants INSERT policy to also block kicked users
DROP POLICY "Users can join unlocked rooms" ON public.room_participants;

CREATE POLICY "Users can join unlocked rooms"
ON public.room_participants FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    NOT EXISTS (
      SELECT 1 FROM public.ephemeral_rooms
      WHERE ephemeral_rooms.id = room_participants.room_id
      AND ephemeral_rooms.is_locked = true
    )
    OR EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = room_participants.room_id
      AND rp.user_id = auth.uid()
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.kicked_participants kp
    WHERE kp.room_id = room_participants.room_id
    AND kp.user_id = auth.uid()
  )
);
