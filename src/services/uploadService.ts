
import { validateImageFile } from '@/utils/imageUtils';
import { analyzeImages } from './geminiService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessProgress {
  processed: number;
  total: number;
  status: 'processing' | 'paused' | 'completed' | 'error';
}

interface ProcessResult {
  fileName: string;
  base64Data: string;
  mimeType: string;
  metadata?: any;
  error?: string;
  success: boolean;
}

interface ProcessedImage {
  success: boolean;
  fileName: string;
  base64Data?: string;
  mimeType?: string;
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

export const processImages = async (
  files: File[],
  onProgress?: (progress: ProcessProgress) => void,
  batchSize: number = 50
) => {
  try {
    // Check if user has enough credits
    const hasEnoughCredits = await checkCredits(files.length);
    if (!hasEnoughCredits) {
      throw new Error('Not enough credits to process these images');
    }

    const results: ProcessResult[] = [];
    const total = files.length;
    let processed = 0;
    let successfulProcessed = 0;

    // Process in batches
    for (let i = 0; i < total; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchPromises = batch.map(async (file) => {
        try {
          validateImageFile(file);
          const base64Data = await imageToBase64(file);
          processed++;
          
          onProgress?.({
            processed,
            total,
            status: 'processing'
          });

          return {
            success: true,
            fileName: file.name,
            base64Data,
            mimeType: file.type
          } as ProcessedImage;
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          return {
            success: false,
            fileName: file.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          } as ProcessedImage;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Only analyze successful conversions with base64 data
      const successfulImages = batchResults.filter((r): r is Required<ProcessedImage> => 
        r.success && !!r.base64Data && !!r.mimeType
      );

      if (successfulImages.length > 0) {
        try {
          const analysisResult = await analyzeImages(successfulImages);
          if (analysisResult.success) {
            // Deduct credits for successful analyses
            await deductCredits(successfulImages.length);
            successfulProcessed += successfulImages.length;

            // Add metadata to successful results
            successfulImages.forEach(img => {
              results.push({
                ...img,
                metadata: analysisResult.metadata
              });
            });
          }
        } catch (error) {
          console.error('Batch analysis error:', error);
          successfulImages.forEach(img => {
            results.push({
              ...img,
              error: 'Metadata generation failed'
            });
          });
        }
      }
      
      // Add failed results
      const failedImages = batchResults.filter(r => !r.success);
      failedImages.forEach(img => {
        results.push({
          fileName: img.fileName,
          base64Data: '',
          mimeType: '',
          success: false,
          error: img.error
        });
      });
    }

    onProgress?.({
      processed: total,
      total,
      status: 'completed'
    });

    return {
      success: true,
      results,
      totalProcessed: processed,
      successfulProcessed
    };
  } catch (error) {
    console.error('Processing error:', error);
    onProgress?.({
      processed: 0,
      total: files.length,
      status: 'error'
    });
    throw error;
  }
};
