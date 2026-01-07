-- Add is_locked column to ephemeral_rooms
ALTER TABLE public.ephemeral_rooms
ADD COLUMN is_locked boolean NOT NULL DEFAULT false;

-- Create RLS policy for creator to update lock status
CREATE POLICY "Room creator can update their rooms"
ON public.ephemeral_rooms
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Drop existing join policy
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_participants;

-- Create new policy that checks room lock status
-- Users can join if: they are the user being added AND (room is not locked OR they're already a participant)
CREATE POLICY "Users can join unlocked rooms"
ON public.room_participants
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    -- Room is not locked
    NOT EXISTS (
      SELECT 1 FROM ephemeral_rooms 
      WHERE id = room_id AND is_locked = true
    )
    OR
    -- User is already a participant (for upsert operations)
    EXISTS (
      SELECT 1 FROM room_participants rp 
      WHERE rp.room_id = room_participants.room_id 
      AND rp.user_id = auth.uid()
    )
  )
);