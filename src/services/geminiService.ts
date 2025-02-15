
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ImageMetadata, systemPrompt } from "@/config/imageAnalysis";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface GeminiImageInput {
  base64Data: string;
  mimeType: string;
}

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
      const metadata = JSON.parse(text) as ImageMetadata;
      return {
        success: true,
        metadata
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      throw new Error('Failed to parse metadata from AI response');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};
