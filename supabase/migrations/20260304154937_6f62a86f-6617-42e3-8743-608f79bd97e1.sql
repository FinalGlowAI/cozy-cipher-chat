
-- Fix testimonials: require authentication for INSERT
DROP POLICY IF EXISTS "Anyone can insert testimonials" ON public.testimonials;
CREATE POLICY "Authenticated users can insert testimonials"
ON public.testimonials FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix encrypted_images: require authentication for INSERT
DROP POLICY IF EXISTS "Anyone can insert encrypted images" ON public.encrypted_images;
CREATE POLICY "Authenticated users can insert encrypted images"
ON public.encrypted_images FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
