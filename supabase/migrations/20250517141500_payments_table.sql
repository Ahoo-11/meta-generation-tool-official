-- Migration: Add payments table and update manage_profile function
-- Created at: 2025-05-17T14:15:00+05:00

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL,
  payment_method TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comment to the table
COMMENT ON TABLE public.payments IS 'Payment records for users';

-- Create index on customer_id for faster lookups
CREATE INDEX IF NOT EXISTS payments_customer_id_idx ON public.payments (customer_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments (user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments (status);

-- Add RLS policies for payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own payments
CREATE POLICY "Users can view their own payments" 
  ON public.payments 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow service role to manage all payments
CREATE POLICY "Service role can manage all payments" 
  ON public.payments 
  USING (auth.role() = 'service_role');

-- Update manage_profile function to handle payment-related operations
CREATE OR REPLACE FUNCTION public.manage_profile(
  p_profile_id UUID,
  p_operation TEXT,
  p_credits INTEGER DEFAULT 0,
  p_subscription_data JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_result JSONB;
BEGIN
  -- Get the profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Profile not found');
  END IF;
  
  -- Handle different operations
  CASE p_operation
    WHEN 'add_credits' THEN
      -- Add credits to the profile
      UPDATE public.profiles
      SET 
        permanent_credits = COALESCE(permanent_credits, 0) + p_credits,
        updated_at = now()
      WHERE id = p_profile_id;
      
      -- Record the transaction
      INSERT INTO public.credit_transactions (
        user_id,
        amount,
        description,
        type,
        metadata
      ) VALUES (
        p_profile_id,
        p_credits,
        'Credits added via payment',
        'payment',
        jsonb_build_object('source', 'dodo_payments')
      );
      
      v_result = jsonb_build_object(
        'success', true,
        'message', 'Credits added successfully',
        'credits_added', p_credits
      );
      
    WHEN 'update_subscription' THEN
      -- Update subscription details
      UPDATE public.profiles
      SET 
        subscription_id = p_subscription_data->>'subscription_id',
        customer_id = p_subscription_data->>'customer_id',
        subscription_plan = p_subscription_data->>'subscription_plan',
        billing_cycle_start = (p_subscription_data->>'billing_cycle_start')::BIGINT,
        billing_cycle_end = (p_subscription_data->>'billing_cycle_end')::BIGINT,
        payment_status = p_subscription_data->>'payment_status',
        monthly_credits = CASE
          WHEN p_subscription_data->>'subscription_plan' = 'basic' THEN 1000
          WHEN p_subscription_data->>'subscription_plan' = 'pro' THEN 5000
          WHEN p_subscription_data->>'subscription_plan' = 'unlimited' THEN 100000
          ELSE 100 -- Free tier
        END,
        updated_at = now()
      WHERE id = p_profile_id;
      
      v_result = jsonb_build_object(
        'success', true,
        'message', 'Subscription updated successfully',
        'subscription_plan', p_subscription_data->>'subscription_plan'
      );
      
    WHEN 'cancel_subscription' THEN
      -- Cancel subscription
      UPDATE public.profiles
      SET 
        payment_status = 'canceled',
        subscription_plan = 'free',
        updated_at = now()
      WHERE id = p_profile_id;
      
      v_result = jsonb_build_object(
        'success', true,
        'message', 'Subscription cancelled successfully'
      );
      
    WHEN 'refresh_credits' THEN
      -- Refresh monthly credits if billing cycle has ended
      IF v_profile.billing_cycle_end IS NOT NULL AND 
         v_profile.billing_cycle_end < extract(epoch from now()) THEN
        
        -- Update billing cycle
        UPDATE public.profiles
        SET 
          billing_cycle_start = extract(epoch from now()),
          billing_cycle_end = extract(epoch from now()) + (30 * 24 * 60 * 60), -- 30 days
          credits = COALESCE(permanent_credits, 0) + COALESCE(monthly_credits, 0),
          updated_at = now()
        WHERE id = p_profile_id;
        
        v_result = jsonb_build_object(
          'success', true,
          'message', 'Monthly credits refreshed',
          'credits', COALESCE(v_profile.permanent_credits, 0) + COALESCE(v_profile.monthly_credits, 0)
        );
      ELSE
        v_result = jsonb_build_object(
          'success', false,
          'message', 'Billing cycle has not ended yet'
        );
      END IF;
      
    ELSE
      -- Unknown operation
      v_result = jsonb_build_object(
        'success', false,
        'message', 'Unknown operation: ' || p_operation
      );
  END CASE;
  
  RETURN v_result;
END;
$$;
