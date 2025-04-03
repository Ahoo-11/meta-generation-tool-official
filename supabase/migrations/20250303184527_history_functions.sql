-- Function to create a new processing session
CREATE OR REPLACE FUNCTION create_processing_session(
  p_user_id uuid,
  p_session_name text,
  p_api_provider text
) RETURNS uuid AS $$
DECLARE
  v_session_id uuid;
BEGIN
  INSERT INTO public.processing_sessions (
    user_id,
    session_name,
    api_provider
  ) VALUES (
    p_user_id,
    p_session_name,
    p_api_provider
  ) RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_processing_session(uuid, text, text) TO authenticated;

-- Function to record a processed image
CREATE OR REPLACE FUNCTION record_processed_image(
  p_session_id uuid,
  p_user_id uuid,
  p_file_name text,
  p_category text,
  p_processing_time_ms integer,
  p_status text,
  p_keywords text[],
  p_title text,
  p_description text,
  p_metadata jsonb
) RETURNS uuid AS $$
DECLARE
  v_image_id uuid;
BEGIN
  INSERT INTO public.processed_images (
    session_id,
    user_id,
    file_name,
    category,
    processing_time_ms,
    status,
    keywords,
    title,
    description,
    metadata
  ) VALUES (
    p_session_id,
    p_user_id,
    p_file_name,
    p_category,
    p_processing_time_ms,
    p_status,
    p_keywords,
    p_title,
    p_description,
    p_metadata
  ) RETURNING id INTO v_image_id;

  RETURN v_image_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION record_processed_image(uuid, uuid, text, text, integer, text, text[], text, text, jsonb) TO authenticated;

-- Function to update session statistics
CREATE OR REPLACE FUNCTION update_session_stats(
  p_session_id uuid,
  p_success_count integer,
  p_failure_count integer,
  p_credits_used integer
) RETURNS boolean AS $$
BEGIN
  UPDATE public.processing_sessions
  SET
    image_count = p_success_count + p_failure_count,
    success_count = p_success_count,
    failure_count = p_failure_count,
    credits_used = p_credits_used
  WHERE id = p_session_id;

  -- Update user_stats
  WITH session_data AS (
    SELECT user_id FROM public.processing_sessions WHERE id = p_session_id
  )
  INSERT INTO public.user_stats (
    user_id,
    total_images_processed,
    total_images_succeeded,
    total_images_failed,
    total_credits_used,
    monthly_images_processed
  )
  SELECT
    user_id,
    p_success_count + p_failure_count,
    p_success_count,
    p_failure_count,
    p_credits_used,
    p_success_count + p_failure_count
  FROM session_data
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_images_processed = user_stats.total_images_processed + EXCLUDED.total_images_processed,
    total_images_succeeded = user_stats.total_images_succeeded + EXCLUDED.total_images_succeeded,
    total_images_failed = user_stats.total_images_failed + EXCLUDED.total_images_failed,
    total_credits_used = user_stats.total_credits_used + EXCLUDED.total_credits_used,
    monthly_images_processed = user_stats.monthly_images_processed + EXCLUDED.monthly_images_processed,
    last_updated_at = now();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_session_stats(uuid, integer, integer, integer) TO authenticated; 