-- Allow UPSERT on room_participants (PostgREST upsert uses ON CONFLICT DO UPDATE)
-- Without an UPDATE policy, upsert will fail with RLS error.
DROP POLICY IF EXISTS "Users can update their own room participations" ON public.room_participants;

CREATE POLICY "Users can update their own room participations"
ON public.room_participants
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
