-- Migration: Add payment integration fields to profiles table
-- Created at: 2025-05-17T14:00:00+05:00

-- Check if the profiles table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    -- Add payment-related columns if they don't exist
    BEGIN
      ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS customer_id TEXT,
        ADD COLUMN IF NOT EXISTS subscription_id TEXT,
        ADD COLUMN IF NOT EXISTS billing_cycle_start BIGINT,
        ADD COLUMN IF NOT EXISTS billing_cycle_end BIGINT,
        ADD COLUMN IF NOT EXISTS payment_status TEXT;
    EXCEPTION
      WHEN duplicate_column THEN
        RAISE NOTICE 'Column already exists in profiles table.';
    END;
    
    -- Create index on customer_id for faster lookups
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND indexname = 'profiles_customer_id_idx'
    ) THEN
      CREATE INDEX profiles_customer_id_idx ON public.profiles (customer_id);
    END IF;
    
    -- Create index on subscription_id for faster lookups
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND indexname = 'profiles_subscription_id_idx'
    ) THEN
      CREATE INDEX profiles_subscription_id_idx ON public.profiles (subscription_id);
    END IF;
    
    -- Add comment to the table
    COMMENT ON TABLE public.profiles IS 'User profiles with payment integration';
    
  ELSE
    RAISE NOTICE 'profiles table does not exist. Migration skipped.';
  END IF;
END
$$;
