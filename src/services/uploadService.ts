import { validateImageFile, compressImage } from '@/utils/imageUtils';
import { analyzeImages } from './imageAnalysisService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MetadataResult } from '@/types';
import { Profile } from '@/stores/profileStore';

// Define the AnalysisResult interface locally if it's not exported from imageAnalysisService
interface AnalysisResult {
  success: boolean;
  metadata: MetadataResult[];
}

interface ProcessProgress {
  totalImages: number;
  processedImages: number;
  successfulImages: number;
  failedImages: number;
  processingTimeMs: number;
  status?: 'processing' | 'paused' | 'completed' | 'error' | 'failed';
}

// Alias for compatibility with other interfaces
type ProgressInfo = ProcessProgress;

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

// Extend the Database type to include our custom RPC functions
declare global {
  interface Database {
    public: {
      Tables: Record<string, unknown>;
      Functions: {
        add_credits: {
          Args: { user_id: string; amount: number; description: string };
          Returns: boolean;
        };
        deduct_credits: {
          Args: { user_id: string; amount: number; description: string };
          Returns: boolean;
        };
        check_credits: {
          Args: { user_id: string; required_credits: number };
          Returns: boolean;
        };
        process_credit_purchase: {
          Args: { 
            user_id: string; 
            package_name: string; 
            amount: number; 
            transaction_id?: string 
          };
          Returns: { 
            success: boolean;
            credits: number;
            permanent_credits: number;
            transaction_id: string | null;
          };
        };
      };
    };
  }
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

  // Use type assertion to bypass TypeScript's strict checking
  const { data, error } = await (supabase.rpc as any)('check_credits', {
    user_id: user.id,
    required_credits: requiredCredits
  });

  if (error) {
    console.error('Error checking credits:', error);
    return false;
  }

  return !!data;
};

// Utility function to refresh profile
export const refreshProfile = async (): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Refresh the profile in the store
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  if (profile) {
    console.log('Profile refreshed:', profile);
    return profile;
  }
  
  return null;
};

// Function to deduct credits from a user's account
export const deductCredits = async (amount: number, description: string = 'Credit deduction'): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Use type assertion to bypass TypeScript's strict checking
  const { data, error } = await (supabase.rpc as any)('deduct_credits', {
    user_id: user.id,
    amount,
    description
  });

  if (error) {
    console.error('Error deducting credits:', error);
    return false;
  }

  return !!data;
};

export const addCredits = async (amount: number, packageName: string = 'Basic Package', description: string = 'Purchased additional credits'): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Call the process_credit_purchase RPC function
  try {
    // Use type assertion to bypass TypeScript's strict checking
    const { data, error } = await (supabase.rpc as any)('process_credit_purchase', {
      user_id: user.id,
      package_name: packageName,
      amount,
      transaction_id: `purchase_${Date.now()}`
    });

    if (error) {
      console.error('Error adding permanent credits:', error);
      return false;
    }

    // After successful addition, refresh the profile
    await refreshProfile();

    // Check if data exists and has a success property
    return data && typeof data === 'object' && 'success' in data ? Boolean(data.success) : false;
  } catch (error) {
    console.error('Error processing credit purchase:', error);
    return false;
  }
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
