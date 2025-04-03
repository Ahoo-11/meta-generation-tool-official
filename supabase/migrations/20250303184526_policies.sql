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
