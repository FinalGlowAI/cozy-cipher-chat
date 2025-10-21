-- Fix function search path for cleanup_expired_encrypted_images
DROP FUNCTION IF EXISTS public.cleanup_expired_encrypted_images();

CREATE OR REPLACE FUNCTION public.cleanup_expired_encrypted_images()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  deleted_count INTEGER := 0;
  expired_image RECORD;
BEGIN
  -- Delete expired records and their storage files
  FOR expired_image IN 
    SELECT code, storage_path 
    FROM public.encrypted_images 
    WHERE expires_at IS NOT NULL AND expires_at < NOW()
  LOOP
    -- Delete from storage
    DELETE FROM storage.objects 
    WHERE bucket_id = 'encrypted_images' 
    AND name = expired_image.storage_path;
    
    -- Delete from table
    DELETE FROM public.encrypted_images WHERE code = expired_image.code;
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$;