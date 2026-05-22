
-- Drop overly permissive storage policies on encrypted_images bucket
DROP POLICY IF EXISTS "Anyone can upload encrypted images" ON storage.objects;
DROP POLICY IF EXISTS "Allow reading encrypted images via signed URLs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete encrypted images from storage" ON storage.objects;
DROP POLICY IF EXISTS "encrypted_images_block_anon" ON storage.objects;

-- Server-side content moderation for ephemeral_messages
CREATE OR REPLACE FUNCTION public.validate_ephemeral_message_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.content ~* '\m(n[i1]gg[e3]r|f[a4]gg[o0]t|k[i1]ke|sp[i1]c|ch[i1]nk)\M'
     OR NEW.content ~* '\m(kill\s+you|murder\s+you|gonna\s+die)\M'
     OR NEW.content ~* '\m(cp|pedo|child\s+porn|underage)\M' THEN
    RAISE EXCEPTION 'Message contains content that violates community guidelines';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ephemeral_messages_content_check ON public.ephemeral_messages;
CREATE TRIGGER ephemeral_messages_content_check
  BEFORE INSERT ON public.ephemeral_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ephemeral_message_content();
