-- Migration to add subscription_events table for tracking subscription plan changes
-- This migration adds support for the new subscription.plan_changed webhook event

-- Create subscription_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    previous_plan TEXT,
    new_plan TEXT,
    amount NUMERIC(10,2),
    currency TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT subscription_events_event_type_check CHECK (
        event_type IN ('plan_changed', 'active', 'on_hold', 'failed', 'renewed', 'cancelled')
    )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_events_profile_id ON public.subscription_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON public.subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON public.subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON public.subscription_events(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Admin can see all events
CREATE POLICY "Admins can see all subscription events" 
ON public.subscription_events 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Users can only see their own events
CREATE POLICY "Users can see their own subscription events" 
ON public.subscription_events 
FOR SELECT 
USING (
  auth.uid() = profile_id
);

-- Add a function to get events for a user's subscription
CREATE OR REPLACE FUNCTION public.get_user_subscription_events(
    user_id UUID,
    event_limit INTEGER DEFAULT 10,
    event_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.subscription_events
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM public.subscription_events
    WHERE profile_id = user_id
    ORDER BY created_at DESC
    LIMIT event_limit
    OFFSET event_offset;
$$;

-- Grant appropriate permissions
GRANT SELECT ON public.subscription_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_events TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.subscription_events IS 'Stores subscription lifecycle events including plan changes';
