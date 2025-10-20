-- Create ephemeral rooms table
CREATE TABLE public.ephemeral_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Create ephemeral messages table
CREATE TABLE public.ephemeral_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.ephemeral_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_color text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ephemeral_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ephemeral_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ephemeral_rooms
CREATE POLICY "Anyone can view rooms"
  ON public.ephemeral_rooms
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create rooms"
  ON public.ephemeral_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for ephemeral_messages
CREATE POLICY "Anyone can view messages in a room"
  ON public.ephemeral_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create messages"
  ON public.ephemeral_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to generate unique room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Enable realtime for ephemeral_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ephemeral_messages;

-- Create index for better performance
CREATE INDEX idx_ephemeral_messages_room_id ON public.ephemeral_messages(room_id);
CREATE INDEX idx_ephemeral_rooms_code ON public.ephemeral_rooms(room_code);