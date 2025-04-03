-- Update profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'unlimited')),
ADD COLUMN IF NOT EXISTS subscription_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS billing_cycle_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS billing_cycle_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS monthly_credits integer DEFAULT 150,
ADD COLUMN IF NOT EXISTS permanent_credits integer DEFAULT 0;

-- Create credits_history table
CREATE TABLE IF NOT EXISTS credits_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    amount integer NOT NULL,
    type text NOT NULL CHECK (type IN ('monthly_refresh', 'usage', 'purchase', 'dev_addition')),
    description text,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);

-- Function to refresh monthly credits
CREATE OR REPLACE FUNCTION refresh_monthly_credits()
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET credits = CASE 
        WHEN subscription_plan = 'free' THEN 150
        WHEN subscription_plan = 'basic' THEN 5000
        WHEN subscription_plan = 'unlimited' THEN 999999
    END
    WHERE (billing_cycle_end < now() OR billing_cycle_end IS NULL)
    AND subscription_plan != 'unlimited';

    -- Record the refresh in history
    INSERT INTO credits_history (user_id, amount, type, description)
    SELECT 
        id,
        CASE 
            WHEN subscription_plan = 'free' THEN 150
            WHEN subscription_plan = 'basic' THEN 5000
            ELSE 0
        END,
        'monthly_refresh',
        'Monthly credit refresh'
    FROM profiles
    WHERE (billing_cycle_end < now() OR billing_cycle_end IS NULL)
    AND subscription_plan != 'unlimited';

    -- Update billing cycle dates
    UPDATE profiles
    SET 
        billing_cycle_start = now(),
        billing_cycle_end = now() + interval '1 month'
    WHERE billing_cycle_end < now() OR billing_cycle_end IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to add credits (for purchases and dev additions)
CREATE OR REPLACE FUNCTION add_credits(
    user_id uuid,
    amount integer,
    credit_type text DEFAULT 'purchase',
    description text DEFAULT 'Credit purchase'
)
RETURNS boolean AS $$
BEGIN
    -- Add to permanent credits since purchased credits don't expire
    UPDATE profiles
    SET permanent_credits = permanent_credits + amount
    WHERE id = user_id;

    -- Record in history
    INSERT INTO credits_history (user_id, amount, type, description)
    VALUES (user_id, amount, credit_type, description);

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(
    user_id uuid,
    amount integer,
    description text DEFAULT 'Image processing'
)
RETURNS boolean AS $$
DECLARE
    user_credits integer;
    user_permanent_credits integer;
    user_monthly_credits integer;
BEGIN
    -- Get user's credit information
    SELECT credits, permanent_credits
    INTO user_monthly_credits, user_permanent_credits
    FROM profiles
    WHERE id = user_id;

    user_credits := user_monthly_credits + user_permanent_credits;

    -- Check if user has enough credits
    IF user_credits < amount THEN
        RETURN false;
    END IF;

    -- First deduct from monthly credits, then from permanent credits
    IF user_monthly_credits >= amount THEN
        UPDATE profiles
        SET credits = credits - amount
        WHERE id = user_id;
    ELSE
        -- Deduct what we can from monthly credits
        UPDATE profiles
        SET 
            credits = 0,
            permanent_credits = permanent_credits - (amount - user_monthly_credits)
        WHERE id = user_id;
    END IF;

    -- Record usage in history
    INSERT INTO credits_history (user_id, amount, type, description)
    VALUES (user_id, -amount, 'usage', description);

    RETURN true;
END;
$$ LANGUAGE plpgsql;
