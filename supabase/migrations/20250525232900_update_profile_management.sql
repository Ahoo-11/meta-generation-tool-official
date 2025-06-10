-- Migration to update the manage_profile function to handle subscription plan changes
-- This enhances the existing functionality from 20250306182300_profile_management.sql

CREATE OR REPLACE FUNCTION public.manage_profile(
  operation TEXT,
  profile_id UUID,
  subscription_plan TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  result JSONB;
  credits_allocation INTEGER;
  permanent_credits INTEGER;
  plan_name TEXT;
BEGIN
  -- Get the current profile
  SELECT * INTO profile_record FROM profiles WHERE id = profile_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Profile not found');
  END IF;

  -- Initialize result object
  result := jsonb_build_object(
    'success', true,
    'profile_id', profile_id,
    'operation', operation
  );

  -- Handle different operations
  CASE operation
    -- Create a new profile with default values
    WHEN 'create' THEN
      UPDATE profiles SET
        credits_remaining = 10,
        credits_total = 10,
        permanent_credits = 0,
        subscription_plan = 'free',
        billing_cycle_start = NOW(),
        billing_cycle_end = NOW() + INTERVAL '30 days',
        updated_at = NOW()
      WHERE id = profile_id;
      
      result := result || jsonb_build_object(
        'message', 'Profile created with default values',
        'credits_allocated', 10
      );
    
    -- Reset credits based on subscription plan
    WHEN 'reset' THEN
      -- Determine credits allocation based on subscription plan
      CASE 
        WHEN subscription_plan IS NOT NULL THEN
          plan_name := subscription_plan;
        ELSE 
          plan_name := COALESCE(profile_record.subscription_plan, 'free');
      END CASE;
      
      -- Determine credits for the plan
      CASE plan_name
        WHEN 'free' THEN 
          credits_allocation := 10;
          permanent_credits := 0;
        WHEN 'basic' THEN 
          credits_allocation := 100;
          permanent_credits := profile_record.permanent_credits;
        WHEN 'unlimited' THEN 
          credits_allocation := 1000;
          permanent_credits := profile_record.permanent_credits;
        ELSE 
          credits_allocation := 10; -- Default to free
          permanent_credits := 0;
      END CASE;
      
      -- Update the profile with new values
      UPDATE profiles SET
        credits_remaining = credits_allocation + permanent_credits,
        credits_total = credits_allocation + permanent_credits,
        permanent_credits = permanent_credits,
        subscription_plan = plan_name,
        billing_cycle_start = NOW(),
        billing_cycle_end = NOW() + INTERVAL '30 days',
        updated_at = NOW()
      WHERE id = profile_id;
      
      result := result || jsonb_build_object(
        'message', 'Profile reset with ' || credits_allocation || ' credits',
        'credits_allocated', credits_allocation,
        'permanent_credits', permanent_credits,
        'subscription_plan', plan_name
      );
    
    -- Refresh credits for existing profile
    WHEN 'refresh' THEN
      -- Determine credits allocation based on subscription plan
      CASE 
        WHEN subscription_plan IS NOT NULL THEN
          plan_name := subscription_plan;
        ELSE 
          plan_name := COALESCE(profile_record.subscription_plan, 'free');
      END CASE;
      
      -- If billing cycle has ended, allocate new credits
      IF profile_record.billing_cycle_end < NOW() OR subscription_plan IS NOT NULL THEN
        -- Determine credits for the plan
        CASE plan_name
          WHEN 'free' THEN 
            credits_allocation := 10;
            permanent_credits := profile_record.permanent_credits;
          WHEN 'basic' THEN 
            credits_allocation := 100;
            permanent_credits := profile_record.permanent_credits;
          WHEN 'unlimited' THEN 
            credits_allocation := 1000;
            permanent_credits := profile_record.permanent_credits;
          ELSE 
            credits_allocation := 10; -- Default to free
            permanent_credits := profile_record.permanent_credits;
        END CASE;
        
        -- Update the profile with new values
        UPDATE profiles SET
          credits_remaining = credits_allocation + permanent_credits,
          credits_total = credits_allocation + permanent_credits,
          permanent_credits = permanent_credits,
          subscription_plan = plan_name,
          billing_cycle_start = NOW(),
          billing_cycle_end = NOW() + INTERVAL '30 days',
          updated_at = NOW()
        WHERE id = profile_id;
        
        result := result || jsonb_build_object(
          'message', 'Profile refreshed with ' || credits_allocation || ' credits',
          'credits_allocated', credits_allocation,
          'permanent_credits', permanent_credits,
          'subscription_plan', plan_name
        );
      ELSE
        result := result || jsonb_build_object(
          'message', 'No refresh needed, billing cycle still active',
          'billing_cycle_end', profile_record.billing_cycle_end
        );
      END IF;
    
    -- Handle subscription plan change (new operation)
    WHEN 'change_plan' THEN
      IF subscription_plan IS NULL THEN
        RETURN jsonb_build_object(
          'success', false, 
          'message', 'No subscription plan provided for plan change'
        );
      END IF;
      
      -- Determine credits for the new plan
      CASE subscription_plan
        WHEN 'free' THEN 
          credits_allocation := 10;
          permanent_credits := profile_record.permanent_credits;
        WHEN 'basic' THEN 
          credits_allocation := 100;
          permanent_credits := profile_record.permanent_credits;
        WHEN 'unlimited' THEN 
          credits_allocation := 1000;
          permanent_credits := profile_record.permanent_credits;
        ELSE 
          credits_allocation := 10; -- Default to free
          permanent_credits := profile_record.permanent_credits;
      END CASE;
      
      -- Update the profile with new plan values
      UPDATE profiles SET
        credits_remaining = credits_allocation + permanent_credits,
        credits_total = credits_allocation + permanent_credits,
        permanent_credits = permanent_credits,
        subscription_plan = subscription_plan,
        billing_cycle_start = NOW(),
        billing_cycle_end = NOW() + INTERVAL '30 days',
        updated_at = NOW()
      WHERE id = profile_id;
      
      -- Record the plan change in subscription_events
      INSERT INTO subscription_events (
        profile_id,
        subscription_id,
        event_type,
        previous_plan,
        new_plan,
        created_at
      ) VALUES (
        profile_id,
        COALESCE(profile_record.subscription_id, 'manual_change'),
        'plan_changed',
        profile_record.subscription_plan,
        subscription_plan,
        NOW()
      );
      
      result := result || jsonb_build_object(
        'message', 'Subscription plan changed from ' || COALESCE(profile_record.subscription_plan, 'none') || ' to ' || subscription_plan,
        'credits_allocated', credits_allocation,
        'permanent_credits', permanent_credits,
        'previous_plan', profile_record.subscription_plan,
        'new_plan', subscription_plan
      );
    
    -- Add permanent credits (doesn't expire with billing cycle)
    WHEN 'add_permanent_credits' THEN
      IF subscription_plan IS NULL THEN
        RETURN jsonb_build_object(
          'success', false, 
          'message', 'No credit amount provided'
        );
      END IF;
      
      -- Parse the credits amount from the subscription_plan parameter
      BEGIN
        permanent_credits := subscription_plan::INTEGER;
      EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
          'success', false, 
          'message', 'Invalid credit amount'
        );
      END;
      
      -- Update the profile with additional permanent credits
      UPDATE profiles SET
        permanent_credits = profile_record.permanent_credits + permanent_credits,
        credits_remaining = profile_record.credits_remaining + permanent_credits,
        credits_total = profile_record.credits_total + permanent_credits,
        updated_at = NOW()
      WHERE id = profile_id;
      
      result := result || jsonb_build_object(
        'message', permanent_credits || ' permanent credits added',
        'previous_permanent_credits', profile_record.permanent_credits,
        'new_permanent_credits', profile_record.permanent_credits + permanent_credits,
        'total_credits', profile_record.credits_remaining + permanent_credits
      );
    
    ELSE
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Unknown operation: ' || operation
      );
  END CASE;

  -- Return the result
  RETURN result;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.manage_profile TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.manage_profile IS 'Manages profile operations including creation, reset, refresh, plan changes, and adding permanent credits';
