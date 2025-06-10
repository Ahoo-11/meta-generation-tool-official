-- Create subscription_events table to track subscription lifecycle events
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  previous_plan TEXT,
  new_plan TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add constraints and indexes
  CONSTRAINT subscription_events_event_type_check 
    CHECK (event_type IN ('created', 'activated', 'on_hold', 'failed', 'renewed', 'plan_changed', 'cancelled'))
);
CREATE INDEX IF NOT EXISTS subscription_events_profile_id_idx ON subscription_events(profile_id);
CREATE INDEX IF NOT EXISTS subscription_events_subscription_id_idx ON subscription_events(subscription_id);

-- Create payment_history table to track payment events
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  error_code TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add constraints and indexes
  CONSTRAINT payment_history_status_check 
    CHECK (status IN ('succeeded', 'failed', 'processing', 'refunded'))
);
CREATE INDEX IF NOT EXISTS payment_history_profile_id_idx ON payment_history(profile_id);
CREATE INDEX IF NOT EXISTS payment_history_payment_id_idx ON payment_history(payment_id);

-- Add new fields to profiles table for subscription tracking if not already present
DO $$ 
BEGIN
  -- Add subscription_id column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'subscription_id') THEN
    ALTER TABLE profiles ADD COLUMN subscription_id TEXT;
  END IF;
  
  -- Add subscription_status column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT;
  END IF;
  
  -- Add subscription_plan column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
    ALTER TABLE profiles ADD COLUMN subscription_plan TEXT;
  END IF;
  
  -- Add subscription_current_period_end column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'subscription_current_period_end') THEN
    ALTER TABLE profiles ADD COLUMN subscription_current_period_end TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add customer_id column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'customer_id') THEN
    ALTER TABLE profiles ADD COLUMN customer_id TEXT;
  END IF;
END $$;
