-- Add serial ID and username fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS sequential_id SERIAL,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create a unique index on sequential_id
CREATE UNIQUE INDEX IF NOT EXISTS profiles_sequential_id_idx ON profiles(sequential_id);

-- Update the handle_new_user function to include username and email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    username,
    credits,
    permanent_credits,
    subscription_plan,
    billing_cycle_start,
    billing_cycle_end,
    monthly_credits,
    avatar_url
  ) VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    CASE 
      WHEN new.raw_user_meta_data->>'plan' = 'basic' THEN 5000
      WHEN new.raw_user_meta_data->>'plan' = 'unlimited' THEN 999999
      ELSE 150
    END,
    0,
    COALESCE(new.raw_user_meta_data->>'plan', 'free'),
    now(),
    now() + interval '1 month',
    CASE 
      WHEN new.raw_user_meta_data->>'plan' = 'basic' THEN 5000
      WHEN new.raw_user_meta_data->>'plan' = 'unlimited' THEN 999999
      ELSE 150
    END,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles with email from auth.users
UPDATE profiles p
SET 
  email = u.email,
  username = COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  avatar_url = u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL; 