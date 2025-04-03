-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    credits,
    permanent_credits,
    subscription_plan,
    billing_cycle_start,
    billing_cycle_end,
    monthly_credits
  ) VALUES (
    new.id,
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
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to manually create a profile for an existing user
CREATE OR REPLACE FUNCTION public.create_profile_for_existing_user(user_id uuid)
RETURNS void AS $$
BEGIN
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
    150,
    0,
    'free',
    now(),
    now() + interval '1 month',
    150
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
