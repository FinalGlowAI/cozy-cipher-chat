-- Make the encrypted_images bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'encrypted_images';

-- Drop the public read policy
DROP POLICY IF EXISTS "Anyone can read encrypted images from storage" ON storage.objects;

-- Keep upload policy for anonymous uploads (needed for the feature)
-- The existing upload policy should remain