import { validateImageFile, compressImage } from '@/utils/imageUtils';
import { analyzeImages, AnalysisResult } from './imageAnalysisService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ApiProvider } from '@/config/apiConfig';

interface ProcessProgress {
  totalImages: number;
  processedImages: number;
  successfulImages: number;
  failedImages: number;
  processingTimeMs: number;
  status?: 'processing' | 'paused' | 'completed' | 'error';
}

interface ProcessResult {
  fileName: string;
  base64Data: string;
  mimeType: string;
  metadata?: Record<string, unknown>;
  error?: string;
  success: boolean;
}

interface ProcessedImage {
  fileName: string;
  base64Data: string;
  mimeType: string;
  success: boolean;
  error?: string;
}

export const imageToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const checkCredits = async (requiredCredits: number): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single();

  return profile?.credits >= requiredCredits;
};

// Utility function to refresh profile
export const refreshProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error refreshing profile:', error);
    return null;
  }

  return data;
};

export const deductCredits = async (amount: number, description: string = 'Image processing'): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc('deduct_credits', {
    user_id: user.id,
    amount,
    description
  });

  if (error) {
    console.error('Error deducting credits:', error);
    return false;
  }

  // After successful deduction, refresh the profile
  await refreshProfile();

  return data;
};

export const addCredits = async (amount: number, description: string = 'Development credit addition'): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc('add_credits', {
    user_id: user.id,
    amount,
    description
  });

  if (error) {
    console.error('Error adding credits:', error);
    return false;
  }

  return data;
};

export const processImageFile = async (file: File): Promise<ProcessedImage> => {
  try {
    validateImageFile(file);
    const { base64Data, mimeType } = await compressImage(file);
    return {
      success: true,
      fileName: file.name,
      base64Data,
      mimeType
    };
  } catch (error) {
    console.error(`Error processing ${file.name}:`, error);
    return {
      success: false,
      fileName: file.name,
      base64Data: '',
      mimeType: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const processImages = async (
  files: File[],
  progressCallback?: (progress: ProcessProgress) => void
): Promise<AnalysisResult> => {
  if (files.length === 0) {
    return { success: false, metadata: [] };
  }

  try {
    const processedImages: ProcessedImage[] = [];
    
    // First, process all images (compress etc.)
    for (const file of files) {
      try {
        const processedImage = await processImageFile(file);
        processedImages.push(processedImage);
        
        // Update progress during compression phase
        if (progressCallback) {
          progressCallback({
            totalImages: files.length,
            processedImages: processedImages.length,
            successfulImages: processedImages.filter(img => img.success).length,
            failedImages: processedImages.filter(img => !img.success).length,
            processingTimeMs: 0,
            status: 'processing'
          });
        }
      } catch (error) {
        console.error("Error processing image:", error);
        // Continue with other images
      }
    }
    
    // Only keep successful image processings
    const successfulImages = processedImages.filter(img => img.success);
    
    if (successfulImages.length === 0) {
      return { success: false, metadata: [] };
    }
    
    // Process all images at once through the analysis service
    // The analyzeImages function will internally handle batching
    // but will return a single consolidated result
    return await analyzeImages(successfulImages, progressCallback);
    
  } catch (error) {
    console.error("Error in processImages:", error);
    return { success: false, metadata: [] };
  }
};
