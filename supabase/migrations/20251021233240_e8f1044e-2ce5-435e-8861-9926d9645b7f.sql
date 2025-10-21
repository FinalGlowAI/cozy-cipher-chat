-- Allow authenticated users to delete messages from ephemeral rooms
CREATE POLICY "Authenticated users can delete messages from rooms"
ON public.ephemeral_messages
FOR DELETE
TO authenticated
USING (true);