-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can read encrypted images" ON public.encrypted_images;
DROP POLICY IF EXISTS "Anyone can delete encrypted images" ON public.encrypted_images;

-- Keep INSERT policy for anonymous sharing (required for the use case)
-- The "Anyone can insert encrypted images" policy remains as is

-- Create restrictive SELECT policy (only for service role and security definer functions)
CREATE POLICY "Only service role can read encrypted images"
ON public.encrypted_images
FOR SELECT
USING (false);

-- Create restrictive DELETE policy (only for service role and security definer functions)
CREATE POLICY "Only service role can delete encrypted images"
ON public.encrypted_images
FOR DELETE
USING (false);

-- Create security definer function to retrieve image metadata by code
CREATE OR REPLACE FUNCTION public.retrieve_encrypted_image(_code TEXT)
RETURNS TABLE (
  code TEXT,
  storage_path TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if code exists and not expired
  RETURN QUERY
  SELECT 
    ei.code,
    ei.storage_path,
    ei.expires_at,
    ei.created_at
  FROM public.encrypted_images ei
  WHERE ei.code = UPPER(_code)
    AND (ei.expires_at IS NULL OR ei.expires_at > NOW());
  
  -- If no rows found, the code doesn't exist or is expired
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code not found or expired';
  END IF;
END;
$$;

-- Create security definer function to delete image by code
CREATE OR REPLACE FUNCTION public.delete_encrypted_image(_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  _storage_path TEXT;
BEGIN
  -- Get storage path and delete from database in one operation
  DELETE FROM public.encrypted_images
  WHERE code = UPPER(_code)
  RETURNING storage_path INTO _storage_path;
  
  IF _storage_path IS NULL THEN
    RAISE EXCEPTION 'Code not found';
  END IF;
  
  -- Delete from storage bucket
  DELETE FROM storage.objects
  WHERE bucket_id = 'encrypted_images'
    AND name = _storage_path;
  
  RETURN _storage_path;
END;
$$;