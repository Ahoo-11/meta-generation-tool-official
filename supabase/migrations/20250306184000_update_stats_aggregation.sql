-- Update the session stats function to include category and keyword aggregation
CREATE OR REPLACE FUNCTION update_session_stats(
  p_session_id uuid,
  p_success_count integer,
  p_failure_count integer,
  p_credits_used integer
) RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_category_distribution jsonb;
  v_common_keywords jsonb;
BEGIN
  -- Get user_id from the session
  SELECT user_id INTO v_user_id
  FROM public.processing_sessions 
  WHERE id = p_session_id;

  -- Calculate category distribution
  WITH category_counts AS (
    SELECT 
      category,
      COUNT(*) as count
    FROM processed_images
    WHERE user_id = v_user_id
      AND status = 'completed'
      AND category IS NOT NULL
    GROUP BY category
  )
  SELECT 
    jsonb_object_agg(category, count)
  INTO v_category_distribution
  FROM category_counts;

  -- Calculate keyword frequency
  WITH keyword_counts AS (
    SELECT 
      unnest(keywords) as keyword,
      COUNT(*) as count
    FROM processed_images
    WHERE user_id = v_user_id
      AND status = 'completed'
      AND array_length(keywords, 1) > 0
    GROUP BY keyword
    ORDER BY count DESC
    LIMIT 50
  )
  SELECT 
    jsonb_object_agg(keyword, count)
  INTO v_common_keywords
  FROM keyword_counts;

  -- Update session stats
  UPDATE public.processing_sessions
  SET
    image_count = p_success_count + p_failure_count,
    success_count = p_success_count,
    failure_count = p_failure_count,
    credits_used = p_credits_used
  WHERE id = p_session_id;

  -- Update user_stats with aggregated data
  INSERT INTO public.user_stats (
    user_id,
    total_images_processed,
    total_images_succeeded,
    total_images_failed,
    total_credits_used,
    monthly_images_processed,
    category_distribution,
    common_keywords,
    last_updated_at
  )
  VALUES (
    v_user_id,
    p_success_count + p_failure_count,
    p_success_count,
    p_failure_count,
    p_credits_used,
    p_success_count + p_failure_count,
    COALESCE(v_category_distribution, '{}'::jsonb),
    COALESCE(v_common_keywords, '{}'::jsonb),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_images_processed = user_stats.total_images_processed + EXCLUDED.total_images_processed,
    total_images_succeeded = user_stats.total_images_succeeded + EXCLUDED.total_images_succeeded,
    total_images_failed = user_stats.total_images_failed + EXCLUDED.total_images_failed,
    total_credits_used = user_stats.total_credits_used + EXCLUDED.total_credits_used,
    monthly_images_processed = user_stats.monthly_images_processed + EXCLUDED.monthly_images_processed,
    category_distribution = COALESCE(v_category_distribution, '{}'::jsonb),
    common_keywords = COALESCE(v_common_keywords, '{}'::jsonb),
    last_updated_at = now();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_session_stats(uuid, integer, integer, integer) TO authenticated; 