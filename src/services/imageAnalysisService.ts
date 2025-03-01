import { ImageMetadata, systemPrompt, categories } from "@/config/imageAnalysis";
import { ApiProvider, API_PROVIDERS } from "@/config/apiConfig";
import { useApiProviderStore } from "@/stores/apiProviderStore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "@/hooks/use-toast";

// Initialize Gemini client
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const openrouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!geminiApiKey) {
  console.error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file');
}

if (!openrouterApiKey) {
  console.error('OpenRouter API key is not configured. Please add VITE_OPENROUTER_API_KEY to your .env file');
}

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

export interface ProcessedImage {
  success: boolean;
  fileName: string;
  base64Data: string;
  mimeType: string;
  error?: string;
}

// Result interface for the API calls
export interface AnalysisResult {
  success: boolean;
  metadata: ImageMetadata[];
}

// Progress tracking interface
export interface ProcessProgress {
  totalImages: number;
  processedImages: number;
  successfulImages: number;
  failedImages: number;
  processingTimeMs: number;
  status?: 'processing' | 'paused' | 'completed' | 'error';
}

// Helper utility for delay
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to clean markdown and extract JSON
const extractJsonFromResponse = (text: string): string => {
  try {
    // Remove markdown code block markers with any variations
    let cleaned = text
      .replace(/```json\s*/gi, '') // Case insensitive match for ```json
      .replace(/```JSON\s*/g, '')  // Explicit match for ```JSON
      .replace(/```\s*/g, '')      // Remove closing ``` with any whitespace
      .trim();

    // Remove any comments (both single line and multi-line)
    cleaned = cleaned
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\/\/.*/g, '')           // Remove single-line comments
      .replace(/\n\s*\n/g, '\n')        // Remove empty lines
      .trim();

    // If the response ends with a comma followed by whitespace and closing bracket
    // remove the trailing comma
    cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1');

    // Test if it's valid JSON
    JSON.parse(cleaned);
    return cleaned;
  } catch (error) {
    console.error('JSON cleaning error:', error);
    console.log('Original text:', text);
    throw error;
  }
};

// Validate metadata structure and content
const validateMetadata = (metadata: Partial<ImageMetadata>, index: number): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check required fields
  if (!metadata.title || typeof metadata.title !== 'string' || metadata.title.trim().length === 0) {
    errors.push('missing or invalid title');
  }
  if (!metadata.description || typeof metadata.description !== 'string' || metadata.description.trim().length === 0) {
    errors.push('missing or invalid description');
  }
  if (!Array.isArray(metadata.keywords) || metadata.keywords.length < 15) {
    errors.push('keywords must be an array with at least 15 items');
  } else {
    // Validate each keyword
    const invalidKeywords = metadata.keywords.filter(k => typeof k !== 'string' || k.trim().length === 0);
    if (invalidKeywords.length > 0) {
      errors.push('some keywords are invalid or empty');
    }
  }
  if (!metadata.category || !categories.includes(metadata.category as string)) {
    errors.push(`invalid category: must be one of [${categories.join(', ')}]`);
  }

  if (errors.length > 0) {
    console.error(`Validation errors for image ${index}:`, errors);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
};

// Retry wrapper for API calls
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> => {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check for rate limit errors
      const isRateLimitError = 
        errorMessage.includes('rate limit') || 
        errorMessage.includes('too many requests') ||
        errorMessage.includes('429');
      
      console.log(`API call failed, attempt ${retries}/${maxRetries}`, error);

      if (retries >= maxRetries) {
        throw error;
      }

      // Use longer delays for rate limit errors
      const waitTime = isRateLimitError ? Math.max(delay * 2, 5000) : delay;
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Exponential backoff capped at 10 seconds
      delay = Math.min(delay * 1.3, 10000);
    }
  }
};

// Check API key status and rate limits
export const checkApiStatus = async (provider: ApiProvider = 'gemini'): Promise<boolean> => {
  try {
    if (provider === 'openrouter') {
      // Check if we have a valid OpenRouter API key
      if (!openrouterApiKey || openrouterApiKey === 'your_openrouter_api_key_here') {
        console.error('OpenRouter API key is not configured or is set to the default value');
        return false;
      }
      
      // Verify the key with the OpenRouter API
      try {
        const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openrouterApiKey}`
          }
        });
        return response.ok;
      } catch (error) {
        console.error('OpenRouter API key validation failed:', error);
        return false;
      }
    } else {
      // Check if we have a valid Gemini API key
      if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
        console.error('Gemini API key is not configured or is set to the default value');
        return false;
      }
      
      // We can't easily validate a Gemini API key without making a full request
      // For now, just return true if it's set to something other than the default
      return true;
    }
  } catch (error) {
    console.error('API status check failed:', error);
    return false;
  }
};

// Process images in smaller chunks to avoid API limits
export const analyzeImagesInChunks = async (
  images: ProcessedImage[], 
  chunkSize: number = 20, // Default batch size of 20 images
  provider?: ApiProvider,
  progressCallback?: (progress: ProcessProgress) => void
): Promise<AnalysisResult> => {
  if (!provider) {
    provider = useApiProviderStore.getState().currentProvider;
  }
  
  // Initialize global statistics
  const globalStats = {
    totalImages: images.length,
    totalBatches: Math.ceil(images.length / chunkSize),
    successfulImages: 0,
    failedImages: 0,
    processingTimeMs: 0,
    batchStats: [] as { 
      batchNumber: number; 
      imagesCount: number; 
      successful: number; 
      failed: number; 
      timeMs: number; 
    }[]
  };

  const globalStartTime = Date.now();
  
  // Check if API is available
  const apiAvailable = await checkApiStatus(provider);
  if (!apiAvailable) {
    toast({
      title: "API Error",
      description: `The ${provider} API is currently unavailable. Please try again later or use a different API provider.`,
      variant: "destructive",
    });
    return { success: false, metadata: [] };
  }
  
  // Split images into batches
  const batches: ProcessedImage[][] = [];
  for (let i = 0; i < images.length; i += chunkSize) {
    batches.push(images.slice(i, Math.min(i + chunkSize, images.length)));
  }
  
  // Prepare output array for results
  const results: (ImageMetadata | null)[] = new Array(images.length).fill(null);
  
  // Set up concurrency control for Gemini API
  const maxConcurrentBatches = 5;
  
  // Define the batch processing function
  const processBatch = async (batch: ProcessedImage[], batchIndex: number): Promise<void> => {
    const batchStartTime = Date.now();
    const batchStat = { 
      batchNumber: batchIndex + 1, 
      imagesCount: batch.length, 
      successful: 0, 
      failed: 0,
      timeMs: 0
    };
    
    try {
      console.log(`Starting batch ${batchStat.batchNumber}/${globalStats.totalBatches} (${batch.length} images)...`);
      const batchResult = await makeAnalysisRequest(batch, provider as ApiProvider);
      
      if (batchResult.success && batchResult.metadata.length > 0) {
        // Map results back to their original positions
        const startIndex = batchIndex * chunkSize;
        batchResult.metadata.forEach((metadata, metadataIndex) => {
          if (startIndex + metadataIndex < results.length) {
            // Add fileName to metadata
            metadata.fileName = batch[metadataIndex].fileName;
            results[startIndex + metadataIndex] = metadata;
            batchStat.successful++;
          }
        });
        
        // If partial success (not all images in batch succeeded)
        if (batchResult.metadata.length < batch.length) {
          batchStat.failed = batch.length - batchResult.metadata.length;
        }
      } else {
        // If batch completely failed, fall back to individual processing
        console.log(`Batch ${batchStat.batchNumber} processing failed, falling back to individual processing...`);
        
        // Process individual images in parallel with a smaller concurrency limit
        const individualConcurrencyLimit = 3;
        const individualPromises: Promise<void>[] = [];
        
        for (let j = 0; j < batch.length; j++) {
          const processIndividual = async () => {
            try {
              const singleResult = await makeAnalysisRequest([batch[j]], provider as ApiProvider);
              if (singleResult.success && singleResult.metadata.length > 0) {
                const index = batchIndex * chunkSize + j;
                if (index < results.length) {
                  // Add fileName to metadata
                  singleResult.metadata[0].fileName = batch[j].fileName;
                  results[index] = singleResult.metadata[0];
                  batchStat.successful++;
                }
              } else {
                batchStat.failed++;
              }
            } catch (error) {
              console.error(`Error processing individual image in batch ${batchStat.batchNumber}:`, error);
              batchStat.failed++;
            }
          };
          
          individualPromises.push(processIndividual());
          
          // Limit concurrency for individual processing
          if (individualPromises.length >= individualConcurrencyLimit) {
            await Promise.all(individualPromises);
            individualPromises.length = 0;
          }
        }
        
        // Wait for any remaining individual processing
        if (individualPromises.length > 0) {
          await Promise.all(individualPromises);
        }
      }
    } catch (error) {
      console.error(`Error processing batch ${batchStat.batchNumber}:`, error);
      batchStat.failed = batch.length;
    }
    
    // Calculate batch processing time
    batchStat.timeMs = Date.now() - batchStartTime;
    console.log(`Completed batch ${batchStat.batchNumber}/${globalStats.totalBatches}: ${batchStat.successful}/${batchStat.imagesCount} successful in ${(batchStat.timeMs / 1000).toFixed(2)}s`);
    
    // Update global stats with this batch's info
    globalStats.batchStats.push(batchStat);
    
    // Update global success/failure counts
    globalStats.successfulImages += batchStat.successful;
    globalStats.failedImages += batchStat.failed;
    
    // Call progress callback if provided
    if (progressCallback) {
      progressCallback({
        totalImages: globalStats.totalImages,
        processedImages: globalStats.successfulImages + globalStats.failedImages,
        successfulImages: globalStats.successfulImages,
        failedImages: globalStats.failedImages,
        processingTimeMs: Date.now() - globalStartTime,
        status: 'processing'
      });
    }
  };
  
  console.log(`Processing all ${images.length} images with batch size ${chunkSize} (${globalStats.totalBatches} batches) using max ${maxConcurrentBatches} concurrent batches...`);
  
  // Process batches with controlled concurrency
  for (let i = 0; i < batches.length; i += maxConcurrentBatches) {
    const currentBatchPromises = batches
      .slice(i, i + maxConcurrentBatches)
      .map((batch, idx) => processBatch(batch, i + idx));
    
    await Promise.all(currentBatchPromises);
  }
  
  // Calculate total processing time
  globalStats.processingTimeMs = Date.now() - globalStartTime;
  
  // Filter out null values
  const validResults = results.filter((item): item is ImageMetadata => item !== null);
  
  // Log comprehensive final statistics
  console.log(`
=================================================
IMAGE PROCESSING COMPLETE - ${typeof provider === 'string' ? provider.toUpperCase() : String(provider).toUpperCase()} API
=================================================
📊 SUMMARY:
• Total images processed: ${globalStats.totalImages}
• Successfully processed: ${globalStats.successfulImages}
• Failed: ${globalStats.failedImages}
• Total batches: ${globalStats.totalBatches}
• Total processing time: ${(globalStats.processingTimeMs / 1000).toFixed(2)}s
• Average time per image: ${(globalStats.processingTimeMs / globalStats.totalImages).toFixed(2)}ms

🔍 BATCH DETAILS:`);
  
  globalStats.batchStats.forEach(batch => {
    console.log(`  • Batch ${batch.batchNumber}/${globalStats.totalBatches}: ${batch.successful}/${batch.imagesCount} successful (${(batch.timeMs / 1000).toFixed(2)}s)`);
  });
  
  console.log(`=================================================`);

  // Final progress callback with completed status
  if (progressCallback) {
    progressCallback({
      totalImages: globalStats.totalImages,
      processedImages: globalStats.totalImages,
      successfulImages: globalStats.successfulImages,
      failedImages: globalStats.failedImages,
      processingTimeMs: globalStats.processingTimeMs,
      status: 'completed'
    });
  }
  
  return {
    success: globalStats.successfulImages > 0,
    metadata: validResults
  };
};

// Main public API for analyzing images
export const analyzeImages = async (
  images: ProcessedImage[],
  provider?: ApiProvider | ((progress: ProcessProgress) => void)
): Promise<AnalysisResult> => {
  let progressCallback: ((progress: ProcessProgress) => void) | undefined;
  
  // Check if provider is actually a progress callback
  if (typeof provider === 'function') {
    progressCallback = provider;
    provider = undefined;
  }
  
  if (!provider) {
    provider = useApiProviderStore.getState().currentProvider;
  }

  try {
    if (images.length === 0) {
      return { success: false, metadata: [] };
    }

    console.log(`Analyzing ${images.length} images using ${provider} API...`);
    
    const apiAvailable = await checkApiStatus(provider);
    if (!apiAvailable) {
      const alternativeProvider: ApiProvider = provider === 'gemini' ? 'openrouter' : 'gemini';
      const alternativeApiAvailable = await checkApiStatus(alternativeProvider);
      
      if (alternativeApiAvailable) {
        toast({
          title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key Invalid`,
          description: `Automatically switching to ${alternativeProvider} API. Please update your API key in the .env file.`,
          variant: "destructive",
        });
        
        useApiProviderStore.getState().setProvider(alternativeProvider);
        provider = alternativeProvider;
      } else {
        toast({
          title: "API Error",
          description: "Both API keys are invalid. Please update your API keys in the .env file.",
          variant: "destructive",
        });
        return { success: false, metadata: [] };
      }
    }
    
    const chunkSize = provider === 'gemini' ? 20 : 20; 
    return await analyzeImagesInChunks(images, chunkSize, provider, progressCallback);
  } catch (error) {
    console.error('Image analysis failed:', error);
    return { success: false, metadata: [] };
  }
};

// Make API calls based on the selected provider
const makeAnalysisRequest = async (
  images: ProcessedImage[],
  provider: ApiProvider
): Promise<AnalysisResult> => {
  if (provider === 'gemini') {
    return makeGeminiRequest(images);
  } else {
    return makeOpenRouterRequest(images);
  }
};

// Make request to Google Gemini API
const makeGeminiRequest = async (
  images: ProcessedImage[]
): Promise<AnalysisResult> => {
  const result = await retryWithBackoff<AnalysisResult>(async () => {
    try {
      const imageParts = images.map(img => ({
        inlineData: {
          data: img.base64Data,
          mimeType: img.mimeType
        }
      }));

      // Set a reasonable timeout for the API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      try {
        const result = await geminiModel.generateContent([
          { text: systemPrompt },
          ...imageParts
        ]);
        
        clearTimeout(timeoutId);
        
        const response = await result.response;
        const text = response.text();
        console.log('Raw response text:', text);

        const cleanedText = extractJsonFromResponse(text);
        console.log('Cleaned response:', cleanedText);

        let parsedData: unknown;
        try {
          parsedData = JSON.parse(cleanedText);
        } catch (error) {
          throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        const dataToProcess = Array.isArray(parsedData) ? parsedData : [parsedData];

        const validatedData = dataToProcess.map((item, index) => {
          const { isValid, errors } = validateMetadata(item as Partial<ImageMetadata>, index);
          if (!isValid) {
            console.error(`Invalid metadata for item ${index}:`, errors);
            return null;
          }
          return item as ImageMetadata;
        });

        const filteredData = validatedData.filter((item): item is ImageMetadata => item !== null);

        return {
          success: filteredData.length > 0,
          metadata: filteredData
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gemini API request timed out after 60 seconds');
      }
      console.error('Gemini API error:', error);
      throw error;
    }
  }, 3, 2000);

  return result;
};

// Make request to OpenRouter API
const makeOpenRouterRequest = async (
  images: ProcessedImage[]
): Promise<AnalysisResult> => {
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
          ...images.map(img => ({
            type: "image_url" as const,
            image_url: {
              url: `data:${img.mimeType};base64,${img.base64Data}`
            }
          }))
        ]
      }
    ]
  };

  const result = await retryWithBackoff<AnalysisResult>(async () => {
    try {
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
      console.log('Raw API Response:', data);

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response structure: Missing content in API response');
      }

      const text = data.choices[0].message.content;
      console.log('Raw response text:', text);

      const cleanedText = extractJsonFromResponse(text);
      console.log('Cleaned response:', cleanedText);

      let parsedData: unknown;
      try {
        parsedData = JSON.parse(cleanedText);
      } catch (error) {
        throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      const dataToProcess = Array.isArray(parsedData) ? parsedData : [parsedData];

      const validatedData = dataToProcess.map((item, index) => {
        const { isValid, errors } = validateMetadata(item as Partial<ImageMetadata>, index);
        if (!isValid) {
          console.error(`Invalid metadata for item ${index}:`, errors);
          return null;
        }
        return item as ImageMetadata;
      });

      const filteredData = validatedData.filter((item): item is ImageMetadata => item !== null);

      return {
        success: filteredData.length > 0,
        metadata: filteredData
      };
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  });

  return result;
};
