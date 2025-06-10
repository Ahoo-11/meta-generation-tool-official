-- Update the manage_profile function to handle subscription operations
CREATE OR REPLACE FUNCTION manage_profile(
  operation TEXT,
  profile_id UUID,
  credits_amount INT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Add credits to a profile
  IF operation = 'add_credits' THEN
    UPDATE profiles
    SET 
      available_credits = available_credits + credits_amount,
      updated_at = NOW()
    WHERE id = profile_id;
  
  -- Deduct credits from a profile
  ELSIF operation = 'deduct_credits' THEN
    UPDATE profiles
    SET 
      available_credits = GREATEST(0, available_credits - credits_amount),
      updated_at = NOW()
    WHERE id = profile_id;
  
  -- Refresh credits based on subscription plan
  ELSIF operation = 'refresh' THEN
    -- Get the subscription plan and update credits accordingly
    UPDATE profiles
    SET 
      available_credits = (
        CASE
          WHEN subscription_plan = 'basic' THEN 100
          WHEN subscription_plan = 'standard' THEN 250
          WHEN subscription_plan = 'premium' THEN 500
          WHEN subscription_plan = 'enterprise' THEN 1000
          ELSE 10 -- Free tier
        END
      ),
      updated_at = NOW()
    WHERE id = profile_id;
  
  -- Reset to free tier
  ELSIF operation = 'reset' THEN
    UPDATE profiles
    SET 
      available_credits = 10, -- Free tier credits
      subscription_id = NULL,
      subscription_status = NULL,
      subscription_plan = NULL,
      subscription_current_period_end = NULL,
      updated_at = NOW()
    WHERE id = profile_id;
  
  END IF;
END;
$$ LANGUAGE plpgsql;
