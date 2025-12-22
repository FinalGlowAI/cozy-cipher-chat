-- Create room_participants table to track who joined which room
CREATE TABLE public.room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.ephemeral_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on room_participants
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for room_participants
CREATE POLICY "Users can view their own room participations"
ON public.room_participants
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can join rooms"
ON public.room_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
ON public.room_participants
FOR DELETE
USING (auth.uid() = user_id);

-- Drop the old permissive policy on ephemeral_messages
DROP POLICY IF EXISTS "Authenticated users can view messages in rooms" ON public.ephemeral_messages;

-- Create new restrictive policy that checks room participation
CREATE POLICY "Users can only view messages in their rooms"
ON public.ephemeral_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_participants 
    WHERE room_participants.room_id = ephemeral_messages.room_id 
    AND room_participants.user_id = auth.uid()
  )
);

-- Also update the DELETE policy to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can delete messages from rooms" ON public.ephemeral_messages;

CREATE POLICY "Users can only delete messages in their rooms"
ON public.ephemeral_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.room_participants 
    WHERE room_participants.room_id = ephemeral_messages.room_id 
    AND room_participants.user_id = auth.uid()
  )
);

-- Enable realtime for room_participants
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;