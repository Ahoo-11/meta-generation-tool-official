import { ImageMetadata, systemPrompt } from "@/config/imageAnalysis";
import { toast } from "@/hooks/use-toast";

interface GeminiImageInput {
  base64Data: string;
  mimeType: string;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to clean markdown and extract JSON
const extractJsonFromResponse = (text: string): string => {
  return text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
};

// Helper to validate metadata structure
const validateMetadata = (data: any): data is ImageMetadata | ImageMetadata[] => {
  if (Array.isArray(data)) {
    return data.every(item => 
      typeof item === 'object' &&
      typeof item.title === 'string' &&
      typeof item.description === 'string' &&
      Array.isArray(item.keywords) &&
      typeof item.category === 'string'
    );
  }
  
  return (
    typeof data === 'object' &&
    typeof data.title === 'string' &&
    typeof data.description === 'string' &&
    Array.isArray(data.keywords) &&
    typeof data.category === 'string'
  );
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

export const analyzeImages = async (images: GeminiImageInput[]) => {
  try {
    // Check API status and rate limits first
    const apiStatus = await checkApiStatus();
    console.log('API Status:', apiStatus);

    // Log the number of images and their total size
    const totalSize = images.reduce((acc, img) => acc + img.base64Data.length, 0);
    console.log(`Processing ${images.length} images with total base64 size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);

    // Prepare all images in a single request
    const requestBody = {
      model: "google/gemini-flash-1.5-8b",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please analyze these images and provide metadata as an array." },
            ...images.map(img => ({
              type: "image_url",
              image_url: {
                url: `data:${img.mimeType};base64,${img.base64Data}`
              }
            }))
          ]
        }
      ]
    };

    // Make the API call with retry logic
    const result = await retryWithBackoff(async () => {
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

      const jsonData = await response.json();
      console.log('Raw API Response:', jsonData);

      if (!response.ok || jsonData.error) {
        // Log detailed error information
        const errorDetails = jsonData.error || {};
        console.error('Detailed error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorDetails,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (errorDetails.code === 429) {
          throw { status: 429, message: 'Rate limit exceeded' };
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle provider-specific errors
        if (errorDetails.metadata?.provider_name) {
          throw new Error(`Provider ${errorDetails.metadata.provider_name} error: ${errorDetails.message}`);
        }

        throw new Error(`API error: ${errorDetails.message || 'Unknown error'}`);
      }

      return jsonData;
    });

    // Validate response structure
    if (!result.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure: No content found');
    }

    const text = result.choices[0].message.content;
    const cleanedText = extractJsonFromResponse(text);
    console.log('Cleaned response:', cleanedText);
    
    const parsedData = JSON.parse(cleanedText);
    
    if (!validateMetadata(parsedData)) {
      throw new Error('Invalid metadata structure in response');
    }

    return {
      success: true,
      metadata: parsedData
    };

  } catch (error) {
    console.error('OpenRouter API error:', error);
    
    // Show user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate metadata';
    toast({
      title: "Error processing images",
      description: errorMessage,
      variant: "destructive"
    });
    
    throw error;
  }
};
