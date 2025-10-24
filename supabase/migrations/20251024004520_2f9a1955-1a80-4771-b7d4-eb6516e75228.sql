-- Add admin email addresses to free_users table with all features
INSERT INTO public.free_users (email, features)
VALUES 
  ('weehab.community@gmail.com', ARRAY['text_encryption', 'image_encryption', 'ephemeral_space']),
  ('jeannedarkchatelain@gmail.com', ARRAY['text_encryption', 'image_encryption', 'ephemeral_space'])
ON CONFLICT (email) DO UPDATE
SET features = EXCLUDED.features, updated_at = NOW();