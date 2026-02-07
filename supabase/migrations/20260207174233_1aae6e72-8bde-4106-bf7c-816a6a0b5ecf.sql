-- Enable realtime for ephemeral_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.ephemeral_messages;