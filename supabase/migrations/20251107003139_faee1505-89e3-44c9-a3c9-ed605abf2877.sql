-- Drop the overly permissive policy that allows anyone to view rooms
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.ephemeral_rooms;

-- Create a restricted policy that only allows authenticated users to view rooms
CREATE POLICY "Authenticated users can view rooms" 
ON public.ephemeral_rooms 
FOR SELECT 
TO authenticated
USING (true);