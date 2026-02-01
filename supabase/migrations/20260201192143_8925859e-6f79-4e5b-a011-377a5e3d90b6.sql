-- Add DELETE policy to prevent unauthorized deletion of user credits
-- Only service role should be able to delete credit records
CREATE POLICY "No user deletion of credits"
ON public.user_credits
FOR DELETE
USING (false);