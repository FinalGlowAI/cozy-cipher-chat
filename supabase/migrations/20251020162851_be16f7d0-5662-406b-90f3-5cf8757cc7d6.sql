-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create messages" ON public.ephemeral_messages;

-- Create a new policy that prevents impersonation
CREATE POLICY "Users can only create messages as themselves"
ON public.ephemeral_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);