-- Drop the existing permissive policy that allows anyone to view messages
DROP POLICY IF EXISTS "Anyone can view messages in a room" ON public.ephemeral_messages;

-- Create a new policy that requires authentication to view messages
CREATE POLICY "Authenticated users can view messages in rooms"
ON public.ephemeral_messages
FOR SELECT
TO authenticated
USING (true);