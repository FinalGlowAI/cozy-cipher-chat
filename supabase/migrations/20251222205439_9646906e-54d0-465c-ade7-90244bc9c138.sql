-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own room participations" ON room_participants;

-- Create a new SELECT policy that allows users to see all participants in rooms they're part of
CREATE POLICY "Users can view room participants"
ON room_participants
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM room_participants rp 
    WHERE rp.room_id = room_participants.room_id 
    AND rp.user_id = auth.uid()
  )
);