
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const prompt = "Generate metadata for these images including: subject matter, style, mood, colors, and any notable features.";
    
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      metadata: text
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};
