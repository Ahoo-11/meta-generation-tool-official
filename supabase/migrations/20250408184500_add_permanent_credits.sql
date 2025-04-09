-- Add functions for managing permanent credits
-- This migration adds support for purchasing additional permanent credits

-- Function to add permanent credits to a user's profile
CREATE OR REPLACE FUNCTION add_permanent_credits(
  user_id uuid,
  amount int,
  description text DEFAULT 'Purchased additional credits'
) RETURNS boolean AS $$
DECLARE
  success boolean;
BEGIN
  -- Update the user's profile with additional permanent credits
  UPDATE public.profiles
  SET
    permanent_credits = permanent_credits + amount,
    credits = credits + amount,
    updated_at = now()
  WHERE id = user_id;
  
  -- Record the transaction in the credit_history table
  INSERT INTO public.credit_history (
    user_id,
    amount,
    description,
    transaction_type,
    created_at
  ) VALUES (
    user_id,
    amount,
    description,
    'purchase',
    now()
  );
  
  success := true;
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a user's permanent credits
CREATE OR REPLACE FUNCTION get_permanent_credits(
  user_id uuid
) RETURNS int AS $$
DECLARE
  perm_credits int;
BEGIN
  SELECT permanent_credits INTO perm_credits
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN perm_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process a credit purchase (to be called after payment confirmation)
CREATE OR REPLACE FUNCTION process_credit_purchase(
  user_id uuid,
  package_name text,
  amount int,
  transaction_id text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  result json;
  success boolean;
BEGIN
  -- Add the permanent credits
  success := add_permanent_credits(
    user_id, 
    amount, 
    'Purchased ' || amount || ' credits (' || package_name || ')'
  );
  
  -- Record the purchase in the purchase_history table if it exists
  BEGIN
    INSERT INTO public.purchase_history (
      user_id,
      package_name,
      credit_amount,
      transaction_id,
      created_at
    ) VALUES (
      user_id,
      package_name,
      amount,
      transaction_id,
      now()
    );
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, create it
    CREATE TABLE IF NOT EXISTS public.purchase_history (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
      package_name text NOT NULL,
      credit_amount int NOT NULL,
      transaction_id text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );
    
    -- Add row to newly created table
    INSERT INTO public.purchase_history (
      user_id,
      package_name,
      credit_amount,
      transaction_id,
      created_at
    ) VALUES (
      user_id,
      package_name,
      amount,
      transaction_id,
      now()
    );
  END;
  
  -- Get updated profile
  SELECT json_build_object(
    'success', success,
    'credits', p.credits,
    'permanent_credits', p.permanent_credits,
    'transaction_id', transaction_id
  )
  INTO result
  FROM public.profiles p
  WHERE p.id = user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for the purchase_history table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_history') THEN
    -- Enable RLS
    ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view their own purchase history"
      ON public.purchase_history
      FOR SELECT
      USING (auth.uid() = user_id);
      
    -- Allow service role full access
    CREATE POLICY "Service role has full access to purchase history"
      ON public.purchase_history
      USING (auth.role() = 'service_role');
  END IF;
END
$$;
