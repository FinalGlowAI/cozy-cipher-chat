
CREATE TABLE public.account_deletion_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  had_subscription BOOLEAN NOT NULL DEFAULT false,
  stripe_subscription_id TEXT
);

ALTER TABLE public.account_deletion_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view deletion logs
CREATE POLICY "Admins can view deletion logs"
  ON public.account_deletion_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No client-side inserts/updates/deletes (service role only via edge function)
CREATE POLICY "No client insert"
  ON public.account_deletion_log
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No client update"
  ON public.account_deletion_log
  FOR UPDATE
  USING (false);

CREATE POLICY "No client delete"
  ON public.account_deletion_log
  FOR DELETE
  USING (false);
