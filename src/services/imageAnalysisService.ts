import { ImageMetadata, systemPrompt, categories } from "@/config/imageAnalysis";
import { ApiProvider } from "@/config/apiConfig";
import { toast } from "@/components/ui/use-toast";
import { deductCredits, checkCredits } from "@/services/uploadService";
import { 
  createProcessingSession, 
  recordProcessedImage, 
  updateSessionStats 
} from "@/services/historyService";
import { compressImage } from '../utils/imageCompression';
import { MetadataResult, ProgressInfo, GlobalStats, BatchStats, BatchError, ProcessedImage } from '@/types';
import { API_CONFIG } from '@/config/apiConfig';

// Define ImageCategory type here to avoid import issues
type ImageCategory = typeof categories[number];

// API key
const openrouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!openrouterApiKey) {
  console.error('OpenRouter API key is not configured. Please add VITE_OPENROUTER_API_KEY to your .env file');
}

// Global state for tracking success/failure stats
let globalStats: GlobalStats = {
  totalImages: 0,
  successfulImages: 0,
  failedImages: 0,
  processingTimeMs: 0,
  batchStats: []
};

// Reset the global stats
export const resetGlobalStats = () => {
  globalStats = {
    totalImages: 0,
    successfulImages: 0,
    failedImages: 0,
    processingTimeMs: 0,
    batchStats: []
  };
};

// Helper function to extract JSON from the API response
const extractJsonFromResponse = (text: string): string => {
  // Check for JSON code block markup
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].trim();
  }
  
  // Try to find JSON array or object directly
  const directJsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (directJsonMatch && directJsonMatch[1]) {
    return directJsonMatch[1].trim();
  }
  
  // If no structured JSON found, return the original text
  // This could cause parsing errors but at least we tried
  return text;
};

// Validate the metadata structure
export const validateMetadata = (metadata: Record<string, any>, index?: number): { isValid: boolean; errorCount: number; errors: string; metadata: MetadataResult | null } => {
  const receivedFields = Object.keys(metadata || {});
  console.log('🔥 DETAILED METADATA VALIDATION:', {
    index,
    receivedFields,
    titleLength: metadata?.title?.length || 0,
    descriptionLength: metadata?.description?.length || 0,
    keywordsCount: metadata?.keywords?.length || 0,
    category: metadata?.category || 'N/A'
  });
  
  const errors: string[] = [];
  
  // Check for required fields
  if (!metadata) {
    errors.push('Metadata is null or undefined');
    return { 
      isValid: false, 
      errorCount: 1, 
      errors: 'Metadata is null or undefined',
      metadata: null
    };
  }
  
  // Check title
  if (!metadata.title) {
    errors.push('Missing title');
  } else if (typeof metadata.title !== 'string') {
    errors.push('Title is not a string');
  } else if (metadata.title.length < 5) {
    errors.push(`Title too short (${metadata.title.length} chars)`);
  } else if (metadata.title.length > 100) {
    errors.push(`Title too long (${metadata.title.length} chars)`);
  }
  
  // Check description
  if (!metadata.description) {
    errors.push('Missing description');
  } else if (typeof metadata.description !== 'string') {
    errors.push('Description is not a string');
  } else if (metadata.description.length < 10) {
    errors.push(`Description too short (${metadata.description.length} chars)`);
  } else if (metadata.description.length > 500) {
    errors.push(`Description too long (${metadata.description.length} chars)`);
  }
  
  // Check keywords
  if (!metadata.keywords) {
    errors.push('Missing keywords');
  } else if (!Array.isArray(metadata.keywords)) {
    errors.push('Keywords is not an array');
  } else if (metadata.keywords.length < 5) {
    errors.push(`Too few keywords (${metadata.keywords.length})`);
  } else if (metadata.keywords.length > 50) {
    errors.push(`Too many keywords (${metadata.keywords.length})`);
  } else {
    // Check that all keywords are strings
    const nonStringKeywords = metadata.keywords.filter(k => typeof k !== 'string');
    if (nonStringKeywords.length > 0) {
      errors.push(`${nonStringKeywords.length} keywords are not strings`);
    }
  }
  
  // Check category
  if (!metadata.category) {
    errors.push('Missing category');
  } else if (typeof metadata.category !== 'string') {
    errors.push('Category is not a string');
  } else if (!categories.includes(metadata.category as any)) {
    errors.push(`Invalid category: ${metadata.category}`);
  }
  
  const validationResult = { 
    isValid: errors.length === 0,
    errorCount: errors.length,
    errors: errors.length ? errors.join(', ') : 'NO ERRORS',
    metadata: errors.length ? null : {
      ...metadata,
      success: true,
    } as MetadataResult
  };
  
  console.log('🔥 VALIDATION RESULT:', validationResult);
  return validationResult;
};

// Helper for exponential backoff retries
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  backoffFactor = 1.5,
  initialDelay = 2000
): Promise<T> => {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.error(`Maximum retries (${maxRetries}) reached. Giving up.`);
        throw error;
      }
      
      console.warn(`Retry ${retries}/${maxRetries} after ${delay}ms due to error:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.floor(delay * backoffFactor);
    }
  }
};

// Make API calls using OpenRouter
const makeAnalysisRequest = async (
  images: ProcessedImage[]
): Promise<{ success: boolean; metadata: MetadataResult[] }> => {
  try {
    console.log(`🔥 MAKING ACTUAL API REQUEST with ${images.length} images...`);
    return await makeOpenRouterRequest(images);
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      metadata: []
    };
  }
};

// Make request to OpenRouter API
const makeOpenRouterRequest = async (
  images: ProcessedImage[]
): Promise<AnalysisResult> => {
  console.log('🌟 Starting OpenRouter API request with images:', images.map(img => img.fileName));

  interface OpenRouterRequestBody {
    model: string;
    messages: {
      role: string;
      content: (
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      )[];
    }[];
  }

  // Validate images have required properties
  for (const img of images) {
    if (!img.base64Data) {
      console.error(`Missing base64Data for image: ${img.fileName}`);
      throw new Error(`Image ${img.fileName} is missing base64Data required for API request`);
    }
    if (!img.mimeType) {
      console.error(`Missing mimeType for image: ${img.fileName}`);
      throw new Error(`Image ${img.fileName} is missing mimeType required for API request`);
    }
  }

  const requestBody: OpenRouterRequestBody = {
    model: "google/gemini-flash-1.5-8b",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: systemPrompt
          },
          ...images.map(img => {
            try {
              return {
                type: "image_url" as const,
                image_url: {
                  url: `data:${img.mimeType};base64,${img.base64Data}`
                }
              };
            } catch (error) {
              console.error(`Error creating image URL for ${img.fileName}:`, error);
              throw new Error(`Failed to prepare image ${img.fileName} for API request: ${error instanceof Error ? error.message : String(error)}`);
            }
          })
        ]
      }
    ]
  };

  console.log('🔥 OPENROUTER REQUEST PREPARED:', {
    model: requestBody.model,
    imageCount: images.length,
    messageCount: requestBody.messages.length,
    contentItems: requestBody.messages[0].content.length
  });

  const result = await retryWithBackoff<AnalysisResult>(async () => {
    try {
      console.log(`🔥 SENDING REQUEST TO OPENROUTER API WITH ${images.length} IMAGES...`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterApiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Pixel Keywording'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`API Error (${response.status}): ${errorData?.error?.message || response.statusText}`);
      }

      interface OpenRouterResponse {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      }

      const data: OpenRouterResponse = await response.json();
      console.log('🔥 RAW API RESPONSE:', data);

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response structure: Missing content in API response');
      }

      const text = data.choices[0].message.content;
      console.log('🔥 API RESPONSE TEXT:', text);

      try {
        const cleanedText = extractJsonFromResponse(text);
        console.log('🔥 CLEANED JSON:', cleanedText);

        let parsedData: unknown;
        try {
          parsedData = JSON.parse(cleanedText);
        } catch (error) {
          console.error('JSON parsing error. Raw text:', text);
          console.error('Cleaned text:', cleanedText);
          throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        const dataToProcess = Array.isArray(parsedData) ? parsedData : [parsedData];
        console.log(`🔥 PROCESSING ${dataToProcess.length} ITEMS FROM RESPONSE FOR ${images.length} INPUT IMAGES`);

        // Log any mismatch between input and output counts
        if (dataToProcess.length !== images.length) {
          console.warn(`⚠️ MISMATCH BETWEEN INPUT IMAGES (${images.length}) AND RESPONSE ITEMS (${dataToProcess.length})`);
          console.log('Input images:', images.map(img => img.fileName));
          console.log('Response data count:', dataToProcess.length);
        }

        // Validate and map metadata 
        // If we have fewer results than images, we need to handle the distribution of metadata
        let validatedData: MetadataResult[] = [];
        
        if (dataToProcess.length < images.length) {
          // Case: API returned fewer metadata items than images sent
          // For each metadata item from API response
          dataToProcess.forEach((item, dataIndex) => {
            // Validate the data
            const validation = validateMetadata(item, dataIndex);
            
            if (!validation.isValid) {
              console.error(`Invalid metadata for item ${dataIndex}:`, validation.errors);
              return; // Skip invalid metadata
            }
            
            // Get base metadata
            const baseMetadata = validation.metadata;
            if (!baseMetadata) return;
            
            // Identify which images this metadata could apply to
            // Extract key patterns from the metadata to match with image filenames
            const metadataTitle = baseMetadata.title?.toLowerCase() || '';
            const keyTerms = metadataTitle.split(' ')
              .filter(term => term.length > 3) // Only use significant words
              .map(term => term.toLowerCase());
              
            // Find images that match these key terms
            const matchingImages = images.filter(img => {
              const fileName = img.fileName.toLowerCase();
              // Check if image name contains any of the key terms
              return keyTerms.some(term => fileName.includes(term));
            });
            
            if (matchingImages.length > 0) {
              // Add metadata for each matching image
              matchingImages.forEach(img => {
                validatedData.push({
                  ...baseMetadata,
                  fileName: img.fileName
                });
              });
            } else {
              // If no match found, assign to the corresponding image by index
              const imgIndex = Math.min(dataIndex, images.length - 1);
              validatedData.push({
                ...baseMetadata,
                fileName: images[imgIndex].fileName
              });
            }
          });
          
          // Handle any remaining unmatched images
          const matchedFiles = validatedData.map(d => d.fileName);
          const unmatchedImages = images.filter(img => !matchedFiles.includes(img.fileName));
          
          if (unmatchedImages.length > 0 && validatedData.length > 0) {
            // For each unmatched image, duplicate the first successful metadata
            const templateMetadata = validatedData[0];
            unmatchedImages.forEach(img => {
              validatedData.push({
                ...templateMetadata,
                fileName: img.fileName,
                // Add a note that this is a duplicated metadata
                description: `${templateMetadata.description} (Similar to other analyzed images)` 
              });
            });
          }
        } else {
          // Normal case: Direct 1:1 mapping between metadata and images
          validatedData = dataToProcess.map((item, index) => {
            const validation = validateMetadata(item, index);
            if (!validation.isValid) {
              console.error(`Invalid metadata for item ${index}:`, validation.errors);
              return {
                title: item?.title || 'Unknown',
                description: item?.description || 'No description available',
                keywords: Array.isArray(item?.keywords) ? item.keywords : [],
                category: 'Other' as ImageCategory,
                fileName: images[index]?.fileName || `unknown-${index}.jpg`,
                success: false,
                error: validation.errors
              } as MetadataResult;
            }
            
            // If we have more results than images, handle gracefully
            const imageIndex = Math.min(index, images.length - 1);
            return {
              ...validation.metadata,
              fileName: images[imageIndex].fileName
            };
          });
        }

        return {
          success: validatedData.some(item => item.success),
          metadata: validatedData
        };
      } catch (error) {
        console.error('Error processing API response:', error);
        throw error;
      }
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }, 3);

  return result;
};

// Process a single batch of images
const processBatch = async (
  images: ProcessedImage[],
  batchIndex: number
): Promise<{ success: boolean; metadata: MetadataResult[] }> => {
  try {
    console.log(`Starting batch ${batchIndex + 1} processing with ${images.length} images`);
    
    // Call the API directly
    const result = await makeAnalysisRequest(images);
    
    // Log results
    if (result.success) {
      console.log(`Batch ${batchIndex + 1} processing succeeded with ${result.metadata.length} results`);
      
      // Validate each metadata item
      const validatedMetadata: MetadataResult[] = [];
      
      for (const metadata of result.metadata) {
        const validation = validateMetadata(metadata);
        
        if (validation.isValid) {
          validatedMetadata.push(metadata);
          globalStats.successfulImages++;
        } else {
          console.warn(`Invalid metadata for ${metadata.fileName}:`, validation.errors);
          globalStats.failedImages++;
        }
      }
      
      // Update global stats
      globalStats.totalImages += images.length;
      
      return {
        success: true,
        metadata: validatedMetadata
      };
    } else {
      console.error(`Batch ${batchIndex + 1} processing failed with API error`);
      globalStats.failedImages += images.length;
      globalStats.totalImages += images.length;
      
      return {
        success: false,
        metadata: []
      };
    }
  } catch (error) {
    console.error(`Error in batch ${batchIndex + 1} processing:`, error);
    globalStats.failedImages += images.length;
    globalStats.totalImages += images.length;
    
    return {
      success: false,
      metadata: []
    };
  }
};

// Analyze images in chunks
const analyzeImagesInChunks = async (
  images: (File | ProcessedImage)[],
  sessionId?: string,
  progressCallback?: (info: ProgressInfo) => void
): Promise<{ success: boolean; metadata: MetadataResult[] }> => {
  // Constants for batch processing
  const MAX_BATCH_SIZE = 3;
  const MAX_CONCURRENT_BATCHES = 1;
  
  const totalImages = images.length;
  let processedCount = 0;
  let successCount = 0;
  let failureCount = 0;
  let allMetadata: MetadataResult[] = [];
  let totalProcessingTime = 0;
  
  // Create batches
  const batches: ProcessedImage[][] = [];
  const processedImages: ProcessedImage[] = [];
  
  // Process images into a standard format if needed
  for (const img of images) {
    if ('base64Data' in img) {
      processedImages.push(img);
    } else {
      // For raw files, compress them first (would need implementation)
      console.warn('Raw File handling not implemented');
    }
  }
  
  // Create batches of appropriate size
  for (let i = 0; i < processedImages.length; i += MAX_BATCH_SIZE) {
    batches.push(processedImages.slice(i, i + MAX_BATCH_SIZE));
  }
  
  console.log(`Created ${batches.length} batches with max size ${MAX_BATCH_SIZE}`);
  
  // Process batches with controlled concurrency
  const allResults: { batch: number; results: MetadataResult[] }[] = [];
  const errors: BatchError[] = [];
  
  // Process batches sequentially (to control rate limits)
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} images`);
    
    try {
      const batchStartTime = Date.now();
      
      // Process this batch using API
      const result = await processBatch(batch, batchIndex);
      const batchProcessingTime = Date.now() - batchStartTime;
      
      // Record batch results
      if (result.success && result.metadata.length > 0) {
        console.log(`Batch ${batchIndex + 1} processed successfully with ${result.metadata.length} results`);
        allResults.push({ batch: batchIndex, results: result.metadata });
        successCount += result.metadata.length;
      } else {
        console.error(`Batch ${batchIndex + 1} failed with no results`);
        // Record individual failures for each image in batch
        batch.forEach(img => {
          errors.push({
            fileName: img.fileName,
            error: 'Batch processing failed',
            processingTime: 0
          });
        });
        failureCount += batch.length;
      }
      
      // Update processed count and processing time
      processedCount += batch.length;
      totalProcessingTime += batchProcessingTime;
      
      // Update progress callback
      if (progressCallback) {
        progressCallback({
          totalImages,
          processedImages: processedCount,
          successfulImages: successCount,
          failedImages: failureCount,
          processingTimeMs: totalProcessingTime,
          currentBatch: batchIndex + 1,
          totalBatches: batches.length,
          status: batchIndex < batches.length - 1 ? 'processing' : 'completed'
        });
      }
      
      // Brief pause between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Error processing batch ${batchIndex + 1}:`, error);
      
      // Record failures for this batch
      batch.forEach(img => {
        errors.push({
          fileName: img.fileName,
          error: error instanceof Error ? error.message : 'Unknown batch error',
          processingTime: 0
        });
      });
      
      failureCount += batch.length;
      processedCount += batch.length;
      
      // Update progress
      if (progressCallback) {
        progressCallback({
          totalImages,
          processedImages: processedCount,
          successfulImages: successCount,
          failedImages: failureCount,
          processingTimeMs: totalProcessingTime,
          currentBatch: batchIndex + 1,
          totalBatches: batches.length,
          status: batchIndex < batches.length - 1 ? 'processing' : 'completed'
        });
      }
    }
  }
  
  // Combine all results
  allResults.forEach(batchResult => {
    allMetadata = [...allMetadata, ...batchResult.results];
  });
  
  // Update session stats if session exists
  if (sessionId) {
    await updateSessionStats(sessionId, successCount, failureCount, successCount);
  }
  
  // Return combined results
  const overallSuccess = successCount > 0;
  return {
    success: overallSuccess,
    metadata: allMetadata
  };
};

// Check API status
const checkApiStatus = async (): Promise<boolean> => {
  // Always using OpenRouter, so just check if the key exists
  return !!openrouterApiKey;
};

// Process batch of images
export const analyzeImages = async (
  images: (File | ProcessedImage)[],
  progressCallback?: (info: ProgressInfo) => void
): Promise<{ success: boolean; metadata: MetadataResult[] }> => {
  try {
    const sessionId: string | null = null; // Use const instead of let
    
    resetGlobalStats();
    
    // Check if user has enough credits
    const hasEnoughCredits = await checkCredits(images.length);
    
    if (!hasEnoughCredits) {
      toast({
        title: "Insufficient Credits",
        description: `You need at least ${images.length} credits to process these images. Failed images won't consume credits.`,
        variant: "destructive",
      });
      return { success: false, metadata: [] };
    }

    // Create a processing session
    const sessionName = `Batch ${new Date().toLocaleString()}`;
    const newSessionId = await createProcessingSession(sessionName);
    
    console.log(`Analyzing ${images.length} images using OpenRouter API...`);
    
    const apiAvailable = await checkApiStatus();
    if (!apiAvailable) {
      toast({
        title: "API Error",
        description: "API key is invalid or not available. Please check your configuration.",
        variant: "destructive",
      });
      return { success: false, metadata: [] };
    }

    const result = await analyzeImagesInChunks(
      images,
      newSessionId, // Pass the newly created session ID
      progressCallback
    );

    // Deduct credits for successfully processed images
    if (result.success) {
      const creditsToDeduct = globalStats.successfulImages;
      if (creditsToDeduct > 0) {
        await deductCredits(creditsToDeduct);
      }
    }

    return result;
  } catch (error) {
    console.error('Analysis error:', error);
    return { success: false, metadata: [] };
  }
};

// Simple interface definition for API response
interface AnalysisResult {
  success: boolean;
  metadata: MetadataResult[];
}
