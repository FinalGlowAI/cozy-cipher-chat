
CREATE OR REPLACE FUNCTION public.earn_credits(
  p_user_id uuid, p_amount int, p_source text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO user_credits (user_id, total_credits, lifetime_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    total_credits = user_credits.total_credits + p_amount,
    lifetime_earned = user_credits.lifetime_earned + p_amount;

  INSERT INTO credit_transactions (user_id, amount, transaction_type, source)
  VALUES (p_user_id, p_amount, 'earned', p_source);
END;
$$;

CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id uuid, p_amount int, p_source text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_balance int;
BEGIN
  SELECT total_credits INTO current_balance
  FROM user_credits WHERE user_id = p_user_id FOR UPDATE;

  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN false;
  END IF;

  UPDATE user_credits
  SET total_credits = total_credits - p_amount
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, transaction_type, source)
  VALUES (p_user_id, p_amount, 'spent', p_source);

  RETURN true;
END;
$$;
