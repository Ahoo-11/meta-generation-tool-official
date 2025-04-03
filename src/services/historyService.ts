import { supabase } from '@/integrations/supabase/client';
import { ProcessingSession, ProcessedImage, UserStats } from '@/types/supabase';
import { ImageMetadata } from '@/config/imageAnalysis';

/**
 * Creates a new processing session
 */
export const createProcessingSession = async (
  sessionName: string
): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('create_processing_session', {
      p_user_id: user.id,
      p_session_name: sessionName,
      p_api_provider: 'openrouter'
    });

    if (error) {
      console.error('Error creating processing session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createProcessingSession:', error);
    return null;
  }
};

/**
 * Updates session statistics
 */
export const updateSessionStats = async (
  sessionId: string,
  successCount: number,
  failureCount: number,
  creditsUsed: number
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('update_session_stats', {
      p_session_id: sessionId,
      p_success_count: successCount,
      p_failure_count: failureCount,
      p_credits_used: creditsUsed
    });

    if (error) {
      console.error('Error updating session stats:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Error in updateSessionStats:', error);
    return false;
  }
};

/**
 * Records a processed image
 */
export const recordProcessedImage = async (
  sessionId: string,
  fileName: string,
  status: 'completed' | 'failed',
  metadata?: ImageMetadata,
  processingTimeMs?: number
): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('record_processed_image', {
      p_session_id: sessionId,
      p_user_id: user.id,
      p_file_name: fileName,
      p_category: metadata?.category || null,
      p_processing_time_ms: processingTimeMs || null,
      p_status: status,
      p_keywords: metadata?.keywords || [],
      p_title: metadata?.title || null,
      p_description: metadata?.description || null,
      p_metadata: metadata ? { ...metadata } : {}
    });

    if (error) {
      console.error('Error recording processed image:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in recordProcessedImage:', error);
    return null;
  }
};

/**
 * Gets processing sessions for the current user
 */
export const getProcessingSessions = async (
  limit: number = 10,
  offset: number = 0
): Promise<ProcessingSession[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('processing_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching processing sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProcessingSessions:', error);
    return [];
  }
};

/**
 * Gets processed images for a specific session
 */
export const getProcessedImages = async (
  sessionId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ProcessedImage[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('processed_images')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching processed images:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProcessedImages:', error);
    return [];
  }
};

/**
 * Gets user statistics
 */
export const getUserStats = async (): Promise<UserStats | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return null;
  }
};

/**
 * Exports session data to CSV
 */
export const exportSessionToCsv = async (sessionId: string): Promise<Blob | null> => {
  try {
    const images = await getProcessedImages(sessionId);
    if (images.length === 0) return null;

    // Implementation of CSV export logic
    // This would be similar to your existing exportToCSV function
    // but adapted for the processed_images data structure
    
    return null; // Replace with actual implementation
  } catch (error) {
    console.error('Error in exportSessionToCsv:', error);
    return null;
  }
};
