
-- Part 1: Create tables and enable RLS
CREATE TABLE IF NOT EXISTS public.processing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  image_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  api_provider TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

CREATE TABLE IF NOT EXISTS public.processed_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.processing_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  category TEXT,
  processing_time_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  keywords TEXT[] DEFAULT '{}',
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_images_processed INTEGER NOT NULL DEFAULT 0,
  total_images_succeeded INTEGER NOT NULL DEFAULT 0,
  total_images_failed INTEGER NOT NULL DEFAULT 0,
  total_credits_used INTEGER NOT NULL DEFAULT 0,
  monthly_images_processed INTEGER NOT NULL DEFAULT 0,
  category_distribution JSONB DEFAULT '{}'::jsonb,
  common_keywords JSONB DEFAULT '{}'::jsonb,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.processing_sessions(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES public.processed_images(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.processing_sessions(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES public.processed_images(id) ON DELETE CASCADE,
  metric TEXT NOT NULL CHECK (metric IN ('images_processed', 'images_succeeded', 'images_failed', 'credits_used')),
  value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.processing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;

-- Part 2: Create policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.processing_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.processing_sessions;
DROP POLICY IF EXISTS "Users can view their own processed images" ON public.processed_images;
DROP POLICY IF EXISTS "Users can insert their own processed images" ON public.processed_images;
DROP POLICY IF EXISTS "Users can view their own user_stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update their own user_stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can view their own history" ON public.history;
DROP POLICY IF EXISTS "Users can insert their own history" ON public.history;
DROP POLICY IF EXISTS "Users can view their own metrics" ON public.stats;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON public.stats;

-- Create RLS policies for processing_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.processing_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.processing_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for processed_images
CREATE POLICY "Users can view their own processed images"
  ON public.processed_images
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own processed images"
  ON public.processed_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_stats
CREATE POLICY "Users can view their own user_stats"
  ON public.user_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own user_stats"
  ON public.user_stats
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for history
CREATE POLICY "Users can view their own history"
  ON public.history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
  ON public.history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for stats
CREATE POLICY "Users can view their own metrics"
  ON public.stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
  ON public.stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);