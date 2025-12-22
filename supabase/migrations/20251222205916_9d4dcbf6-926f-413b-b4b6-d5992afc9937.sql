-- Fix: remove recursive room_participants SELECT policy
DROP POLICY IF EXISTS "Users can view room participants" ON public.room_participants;

-- Restore non-recursive policy (users can only see their own participation rows)
CREATE POLICY "Users can view their own room participations"
ON public.room_participants
FOR SELECT
USING (auth.uid() = user_id);
