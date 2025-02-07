import { validateImageFile } from '@/utils/imageUtils';
import { analyzeImages } from './geminiService';

interface ProcessProgress {
  processed: number;
  total: number;
  status: 'processing' | 'paused' | 'completed' | 'error';
}

interface ProcessResult {
  fileName: string;
  base64Data: string;
  mimeType: string;
  metadata?: string;
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

export const processImages = async (
  files: File[],
  onProgress?: (progress: ProcessProgress) => void,
  batchSize: number = 50
) => {
  try {
    const results: ProcessResult[] = [];
    const total = files.length;
    let processed = 0;

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
      totalProcessed: processed
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