-- Create a function to manage profiles
CREATE OR REPLACE FUNCTION manage_profile(
  user_id uuid,
  action text, -- 'create', 'reset', 'refresh'
  plan text DEFAULT 'free'
) RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Create or update profile based on action
  CASE action
    WHEN 'create' THEN
      INSERT INTO public.profiles (
        id,
        credits,
        permanent_credits,
        subscription_plan,
        billing_cycle_start,
        billing_cycle_end,
        monthly_credits
      ) VALUES (
        user_id,
        CASE 
          WHEN plan = 'basic' THEN 5000
          WHEN plan = 'unlimited' THEN 999999
          ELSE 150
        END,
        0,
        plan,
        now(),
        now() + interval '1 month',
        CASE 
          WHEN plan = 'basic' THEN 5000
          WHEN plan = 'unlimited' THEN 999999
          ELSE 150
        END
      )
      ON CONFLICT (id) DO NOTHING;

    WHEN 'reset' THEN
      UPDATE public.profiles
      SET
        credits = CASE 
          WHEN subscription_plan = 'basic' THEN 5000
          WHEN subscription_plan = 'unlimited' THEN 999999
          ELSE 150
        END,
        permanent_credits = 0,
        billing_cycle_start = now(),
        billing_cycle_end = now() + interval '1 month'
      WHERE id = user_id;

    WHEN 'refresh' THEN
      -- Do nothing, just return current profile
      NULL;
  END CASE;

  -- Get current profile state
  SELECT json_build_object(
    'id', p.id,
    'credits', p.credits,
    'permanent_credits', p.permanent_credits,
    'subscription_plan', p.subscription_plan,
    'billing_cycle_start', p.billing_cycle_start,
    'billing_cycle_end', p.billing_cycle_end,
    'monthly_credits', p.monthly_credits
  )
  INTO result
  FROM public.profiles p
  WHERE p.id = user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
