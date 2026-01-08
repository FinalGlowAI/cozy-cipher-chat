-- Add last_decay_at column to track when decay was last applied
ALTER TABLE public.user_credits 
ADD COLUMN last_decay_at timestamp with time zone NOT NULL DEFAULT now();