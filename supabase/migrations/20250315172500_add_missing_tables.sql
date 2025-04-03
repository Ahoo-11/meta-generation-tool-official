-- Create processing_sessions table
CREATE TABLE IF NOT EXISTS public.processing_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'in_progress',
    total_images INTEGER DEFAULT 0,
    processed_images INTEGER DEFAULT 0,
    successful_images INTEGER DEFAULT 0,
    failed_images INTEGER DEFAULT 0,
    model_used TEXT
);

-- Create processed_images table
CREATE TABLE IF NOT EXISTS public.processed_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.processing_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT,
    original_size INTEGER,
    compressed_size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    title TEXT,
    description TEXT,
    keywords JSONB,
    category TEXT,
    error_message TEXT
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_images_processed INTEGER DEFAULT 0,
    total_images_succeeded INTEGER DEFAULT 0,
    total_images_failed INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_completed_sessions INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create credit_history table if it doesn't exist already
CREATE TABLE IF NOT EXISTS public.credit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies for the new tables
ALTER TABLE public.processing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

-- Create policies for processing_sessions
CREATE POLICY "Users can view their own processing sessions"
    ON public.processing_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own processing sessions"
    ON public.processing_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processing sessions"
    ON public.processing_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policies for processed_images
CREATE POLICY "Users can view their own processed images"
    ON public.processed_images
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own processed images"
    ON public.processed_images
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processed images"
    ON public.processed_images
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policies for user_stats
CREATE POLICY "Users can view their own stats"
    ON public.user_stats
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
    ON public.user_stats
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policies for credit_history
CREATE POLICY "Users can view their own credit history"
    ON public.credit_history
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own credit history"
    ON public.credit_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
