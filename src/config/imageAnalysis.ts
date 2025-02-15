
export const categories = [
  "Animal",
  "Buildings and Architecture",
  "Business",
  "Drinks",
  "The Environment",
  "States of Mind",
  "Food",
  "Graphic Resources",
  "Hobbies and Leisure",
  "Industry",
  "Landscape",
  "Lifestyle",
  "People",
  "Plants and Flowers",
  "Culture and Religion",
  "Science",
  "Social Issues",
  "Sports",
  "Technology",
  "Transport",
  "Travel"
] as const;

export type ImageCategory = typeof categories[number];

export interface ImageMetadata {
  title: string;
  description: string;
  keywords: string[];
  category: ImageCategory;
}

export const systemPrompt = `Analyze this image and provide the following metadata in JSON format:

{
  "title": "A clear, descriptive title for the image",
  "description": "A detailed description of what's in the image, its context, and notable elements",
  "keywords": ["array", "of", "relevant", "keywords", "maximum 5"],
  "category": "MUST be exactly one of the following categories: ${categories.join(', ')}"
}

Requirements:
1. Response MUST be in valid JSON format
2. Category MUST match exactly one from the provided list
3. Keywords should be specific and relevant, maximum 5
4. Description should be 2-3 sentences
5. Title should be concise but descriptive`;
