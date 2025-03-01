import { ImageMetadata, systemPrompt } from "@/config/imageAnalysis";
import { toast } from "@/hooks/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

interface GeminiImageInput {
  base64Data: string;
  mimeType: string;
}

interface ProcessedImage {
  base64Data: string;
  mimeType: string;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to clean markdown and extract JSON
const extractJsonFromResponse = (text: string): string => {
  try {
    let cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
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
  const validCategories = [
    "Graphic Resources", "People", "Nature", "Food", "Technology",
    "Culture and Religion", "Landscape", "Business", "Abstract", "Architecture"
  ];

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
  if (!metadata.category || !validCategories.includes(metadata.category)) {
    errors.push(`invalid category: must be one of [${validCategories.join(', ')}]`);
  }

  if (errors.length > 0) {
    console.error(`Validation errors for image ${index}:`, errors);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
};

// Retry wrapper for API calls
const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  initialDelay: number = 2000
) => {
  let retries = 0;
  let delay = initialDelay;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.status === 429) {
        retries++;
        if (retries === maxRetries) {
          throw new Error('Rate limit exceeded. Please try again in a few minutes.');
        }
        toast({
          title: "Rate limit hit",
          description: `Waiting ${delay/1000} seconds before retrying...`,
          variant: "default"
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
};

// Check API key status and rate limits
const checkApiStatus = async () => {
  const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to check API status');
  }
  
  return await response.json();
};

// Process images in smaller chunks to avoid API limits
const analyzeImagesInChunks = async (images: ProcessedImage[], chunkSize: number = 5) => {
  const results: Partial<ImageMetadata>[] = new Array(images.length).fill(null);
  const maxRetries = 2;
  
  for (let i = 0; i < images.length; i += chunkSize) {
    const chunkStart = i;
    const chunkEnd = Math.min(i + chunkSize, images.length);
    const chunk = images.slice(chunkStart, chunkEnd);
    const chunkIndex = Math.floor(i / chunkSize) + 1;
    const totalChunks = Math.ceil(images.length / chunkSize);
    
    console.log(`Processing chunk ${chunkIndex} of ${totalChunks}, size: ${chunk.length} images`);
    
    let retryCount = 0;
    let success = false;
    
    while (retryCount <= maxRetries && !success) {
      try {
        if (retryCount > 0) {
          console.log(`Retry attempt ${retryCount} for chunk ${chunkIndex}`);
          // Exponential backoff for retries
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
        
        const chunkResult = await makeAnalysisRequest(chunk);
        
        if (chunkResult.success && Array.isArray(chunkResult.metadata)) {
          // Update results array with successful metadata
          chunkResult.metadata.forEach((metadata, index) => {
            if (metadata) {
              results[chunkStart + index] = metadata;
            }
          });
          success = true;
        } else {
          throw new Error(chunkResult.error || 'Unknown error in chunk processing');
        }
      } catch (error) {
        console.error(`Error processing chunk ${chunkIndex} (attempt ${retryCount + 1}):`, error);
        retryCount++;
        
        if (retryCount > maxRetries) {
          console.error(`Failed to process chunk ${chunkIndex} after ${maxRetries} retries`);
        }
      }
    }
    
    // Add a delay between chunks to avoid rate limits
    // Increase delay if previous chunk failed
    const delayTime = success ? 500 : 2000;
    await new Promise(resolve => setTimeout(resolve, delayTime));
  }
  
  // Log final statistics
  const successCount = results.filter(r => r !== null).length;
  console.log(`Processing completed. Success rate: ${((successCount / images.length) * 100).toFixed(1)}% (${successCount}/${images.length})`);
  
  return results;
};

export const analyzeImages = async (images: ProcessedImage[]): Promise<{ success: boolean; metadata: Partial<ImageMetadata>[] }> => {
  try {
    console.log(`Processing ${images.length} images with total base64 size: ${(images.reduce((acc, img) => acc + (img.base64Data?.length || 0), 0) / (1024 * 1024)).toFixed(2)}MB`);
    
    const metadata = await analyzeImagesInChunks(images);
    
    // Check if we have metadata for all images
    const validMetadata = metadata.map((meta, index) => {
      if (!meta) return null;
      
      // Validate metadata structure
      if (!meta.title || !meta.description || !meta.keywords || !meta.category) {
        console.error(`Invalid metadata structure for image ${index}:`, meta);
        return null;
      }
      
      return meta;
    });

    return {
      success: true,
      metadata: validMetadata
    };
  } catch (error) {
    console.error('Error analyzing images:', error);
    throw error;
  }
};

const makeAnalysisRequest = async (images: ProcessedImage[]) => {
  const requestBody = {
    model: "google/gemini-flash-1.5-8b",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze these images and generate metadata in JSON format. For each image, provide a title, description, relevant keywords (at least 15), and a category. Categories should be one of: ["Graphic Resources", "People", "Nature", "Food", "Technology", "Culture and Religion", "Landscape", "Business", "Abstract", "Architecture"].\n\nRespond ONLY with a JSON array containing metadata objects for each image. Each object should have: title, description, keywords (array), and category fields. Do not include any other text or explanations.`
          },
          ...images.map(img => ({
            type: "image",
            source: {
              type: "base64",
              media_type: img.mimeType,
              data: img.base64Data
            }
          }))
        ]
      }
    ]
  };

  const result = await retryWithBackoff(async () => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Pixel Keywording'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`API Error (${response.status}): ${errorData?.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw API Response:', data);

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response structure: Missing content in API response');
      }

      const text = data.choices[0].message.content;
      console.log('Raw response text:', text);

      const cleanedText = extractJsonFromResponse(text);
      console.log('Cleaned response:', cleanedText);

      let parsedData;
      try {
        parsedData = JSON.parse(cleanedText);
      } catch (error) {
        throw new Error(`Failed to parse JSON response: ${error.message}`);
      }
      
      if (!Array.isArray(parsedData)) {
        throw new Error('Response is not an array');
      }

      // Validate metadata structure for each item
      const validatedData = parsedData.map((item, index) => {
        const validation = validateMetadata(item, index);
        if (!validation.isValid) {
          console.error(`Invalid metadata for image ${index}:`, validation.errors.join(', '));
          return null;
        }
        return {
          ...item,
          title: item.title.trim(),
          description: item.description.trim(),
          keywords: item.keywords.map(k => k.trim()),
          category: item.category.trim()
        };
      });

      return {
        success: true,
        metadata: validatedData
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error.message,
        metadata: images.map(() => null)
      };
    }
  });

  return result;
};

const parseGeminiResponse = async (responseText: string): Promise<Partial<ImageMetadata>> => {
  try {
    const cleanJsonString = extractJsonFromResponse(responseText);
    return JSON.parse(cleanJsonString);
  } catch (error) {
    console.error("Error parsing response:", error);
    return {};
  }
};
