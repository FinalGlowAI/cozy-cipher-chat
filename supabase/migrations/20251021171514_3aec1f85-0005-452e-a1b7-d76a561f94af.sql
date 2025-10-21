-- Create storage bucket for encrypted images
INSERT INTO storage.buckets (id, name, public)
VALUES ('encrypted_images', 'encrypted_images', true)
ON CONFLICT (id) DO NOTHING;

-- Create table to track encrypted images
CREATE TABLE IF NOT EXISTS public.encrypted_images (
  code TEXT PRIMARY KEY,
  storage_path TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.encrypted_images ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read (needed to decrypt with code)
CREATE POLICY "Anyone can read encrypted images"
ON public.encrypted_images
FOR SELECT
USING (true);

-- Policy: Anyone can insert (no auth required for encryption)
CREATE POLICY "Anyone can insert encrypted images"
ON public.encrypted_images
FOR INSERT
WITH CHECK (true);

-- Policy: Anyone can delete expired images
CREATE POLICY "Anyone can delete encrypted images"
ON public.encrypted_images
FOR DELETE
USING (true);

-- Storage policies for encrypted_images bucket
CREATE POLICY "Anyone can read encrypted images from storage"
ON storage.objects
FOR SELECT
USING (bucket_id = 'encrypted_images');

CREATE POLICY "Anyone can upload encrypted images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'encrypted_images');

CREATE POLICY "Anyone can delete encrypted images from storage"
ON storage.objects
FOR DELETE
USING (bucket_id = 'encrypted_images');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_encrypted_images_expires_at 
ON public.encrypted_images(expires_at);

-- Function to clean up expired images
CREATE OR REPLACE FUNCTION public.cleanup_expired_encrypted_images()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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
    PERFORM storage.objects 
    WHERE bucket_id = 'encrypted_images' 
    AND name = expired_image.storage_path;
    
    -- Delete from table
    DELETE FROM public.encrypted_images WHERE code = expired_image.code;
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$;