
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ImageMetadata, systemPrompt } from "@/config/imageAnalysis";
import { toast } from "@/hooks/use-toast";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface GeminiImageInput {
  base64Data: string;
  mimeType: string;
}

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

export const analyzeImages = async (images: GeminiImageInput[]) => {
  try {
    // Changed model to "gemini-pro-vision"
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const imageParts = images.map(img => ({
      inlineData: {
        data: img.base64Data,
        mimeType: img.mimeType
      }
    }));

    const result = await model.generateContent([systemPrompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    try {
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
      console.error('Raw Gemini response:', text);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse metadata from AI response');
    }
  } catch (error: any) {
    console.error('Gemini API error:', error);
    toast({
      title: "Error processing image",
      description: error.message || "Failed to generate metadata. Please try again.",
      variant: "destructive"
    });
    throw error;
  }
};
