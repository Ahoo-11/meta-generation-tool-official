
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
const validateMetadata = (data: any): data is ImageMetadata => {
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

export const analyzeImages = async (images: GeminiImageInput[]) => {
  try {
    const imageParts = images.map(img => ({
      data: img.base64Data,
      mime_type: img.mimeType
    }));

    const requestBody = {
      model: "google/gemini-flash-1.5-8b",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            ...imageParts.map(img => ({
              type: "image_url",
              image_url: {
                url: `data:${img.mime_type};base64,${img.data}`
              }
            }))
          ]
        }
      ]
    };

    // Wrap the API call with retry logic
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

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenRouter API error details:', error);
        throw new Error(error.message || 'Failed to generate metadata');
      }

      return response.json();
    });

    try {
      const text = result.choices[0].message.content;
      const cleanedText = extractJsonFromResponse(text);
      console.log('Cleaned response:', cleanedText);
      
      const parsedData = JSON.parse(cleanedText);
      
      if (!validateMetadata(parsedData)) {
        throw new Error('Response does not match expected metadata structure');
      }

      return {
        success: true,
        metadata: parsedData as ImageMetadata
      };
    } catch (parseError) {
      console.error('Raw OpenRouter response:', result);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse metadata from AI response');
    }
  } catch (error: any) {
    console.error('OpenRouter API error:', error);
    // Show user-friendly error message
    toast({
      title: "Error processing image",
      description: error.message || "Failed to generate metadata. Please try again.",
      variant: "destructive"
    });
    throw error;
  }
};
