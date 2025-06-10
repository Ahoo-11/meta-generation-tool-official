-- Create function to log subscription events
CREATE OR REPLACE FUNCTION log_subscription_event(
  p_profile_id UUID,
  p_subscription_id TEXT,
  p_event_type TEXT,
  p_previous_plan TEXT DEFAULT NULL,
  p_new_plan TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- First try inserting into subscription_events if the table exists
  BEGIN
    INSERT INTO subscription_events (
      profile_id,
      subscription_id,
      event_type,
      previous_plan,
      new_plan,
      metadata,
      created_at
    ) VALUES (
      p_profile_id,
      p_subscription_id,
      p_event_type,
      p_previous_plan,
      p_new_plan,
      p_metadata,
      NOW()
    );
  EXCEPTION WHEN undefined_table THEN
    -- If the table doesn't exist yet, log to credit_transactions as a fallback
    INSERT INTO credit_transactions (
      user_id,
      amount,
      type,
      description,
      metadata,
      created_at
    ) VALUES (
      p_profile_id,
      0, -- Not affecting credits
      'subscription_' || p_event_type,
      'Subscription event: ' || p_event_type,
      jsonb_build_object(
        'subscription_id', p_subscription_id,
        'event_type', p_event_type,
        'previous_plan', p_previous_plan,
        'new_plan', p_new_plan,
        'additional_data', p_metadata
      ),
      NOW()
    );
  END;
END;
$$ LANGUAGE plpgsql;
