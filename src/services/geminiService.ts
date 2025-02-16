
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ImageMetadata, systemPrompt } from "@/config/imageAnalysis";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface GeminiImageInput {
  base64Data: string;
  mimeType: string;
}

// Helper function to clean markdown and extract JSON
const extractJsonFromResponse = (text: string): string => {
  // Remove markdown code block markers if present
  const cleanText = text
    .replace(/```json\n?/g, '')  // Remove ```json
    .replace(/```\n?/g, '')      // Remove closing ```
    .trim();                     // Clean up whitespace

  return cleanText;
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

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
      // Clean and parse the response
      const cleanedText = extractJsonFromResponse(text);
      console.log('Cleaned response:', cleanedText); // Debug log
      
      const parsedData = JSON.parse(cleanedText);
      
      // Validate the parsed data
      if (!validateMetadata(parsedData)) {
        throw new Error('Response does not match expected metadata structure');
      }

      return {
        success: true,
        metadata: parsedData as ImageMetadata
      };
    } catch (parseError) {
      console.error('Raw Gemini response:', text); // Debug log
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse metadata from AI response');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};
