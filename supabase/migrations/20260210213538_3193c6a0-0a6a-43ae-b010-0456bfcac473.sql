-- Allow room creators to unkick (delete) participants
CREATE POLICY "Creators can unkick participants"
ON public.kicked_participants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.ephemeral_rooms
    WHERE ephemeral_rooms.id = kicked_participants.room_id
    AND ephemeral_rooms.created_by = auth.uid()
  )
);