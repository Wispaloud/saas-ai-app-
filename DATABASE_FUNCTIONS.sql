-- ========================================
-- Database Functions for Usage Tracking
-- ========================================

-- Function to increment usage metrics
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_date DATE,
  p_tokens INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  existing_usage RECORD;
BEGIN
  -- Check if usage record exists for this date
  SELECT * INTO existing_usage 
  FROM public.usage_metrics 
  WHERE user_id = p_user_id AND date = p_date;

  IF existing_usage IS NOT NULL THEN
    -- Update existing record
    UPDATE public.usage_metrics 
    SET 
      generations_count = generations_count + 1,
      tokens_used = tokens_used + p_tokens
    WHERE user_id = p_user_id AND date = p_date;
  ELSE
    -- Insert new record
    INSERT INTO public.usage_metrics (user_id, date, generations_count, tokens_used)
    VALUES (p_user_id, p_date, 1, p_tokens);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user dashboard data
CREATE OR REPLACE FUNCTION public.get_user_dashboard()
RETURNS TABLE (
  profile_id UUID,
  name TEXT,
  avatar_url TEXT,
  plan TEXT,
  status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  total_generations BIGINT,
  total_tokens_used BIGINT,
  current_month_generations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.name,
    p.avatar_url,
    s.plan,
    s.status,
    s.current_period_end,
    COUNT(ag.id) as total_generations,
    COALESCE(SUM(ag.tokens_used), 0) as total_tokens_used,
    COALESCE(um.generations_count, 0) as current_month_generations
  FROM public.profiles p
  LEFT JOIN public.subscriptions s ON p.user_id = s.user_id
  LEFT JOIN public.ai_generations ag ON p.user_id = ag.user_id
  LEFT JOIN public.usage_metrics um ON p.user_id = um.user_id AND um.date = CURRENT_DATE
  WHERE p.user_id = auth.uid()
  GROUP BY p.id, p.name, p.avatar_url, s.plan, s.status, s.current_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user limits
CREATE OR REPLACE FUNCTION public.check_user_limit(p_user_id UUID)
RETURNS TABLE (
  plan TEXT,
  current_generations BIGINT,
  max_generations INTEGER,
  remaining_generations INTEGER
) AS $$
DECLARE
  user_plan TEXT;
  current_month TEXT;
  current_gen BIGINT;
  max_gen INTEGER;
BEGIN
  -- Get user's plan
  SELECT COALESCE(s.plan, 'free') INTO user_plan
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id;

  -- Get current month usage
  current_month := to_char(CURRENT_DATE, 'YYYY-MM');
  
  SELECT COALESCE(SUM(generations_count), 0) INTO current_gen
  FROM public.usage_metrics
  WHERE user_id = p_user_id 
  AND date >= (current_month || '-01')::DATE 
  AND date <= (current_month || '-31')::DATE;

  -- Get plan limits
  max_gen := CASE user_plan
    WHEN 'free' THEN 10
    WHEN 'pro' THEN 1000
    WHEN 'enterprise' THEN 2147483647 -- Max int for "unlimited"
    ELSE 10
  END;

  RETURN QUERY SELECT user_plan, current_gen, max_gen, max_gen - current_gen;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.increment_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_limit TO authenticated;
