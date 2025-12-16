-- Add storage SELECT policy to allow signed URL creation
-- Security is enforced by the code lookup in the database (via RPC)
-- Anyone who has the storage_path from a valid code can access the encrypted image
CREATE POLICY "Allow reading encrypted images via signed URLs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'encrypted_images');