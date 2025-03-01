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
  fileName?: string;
}

export const systemPrompt = `Analyze the provided image(s) and provide the following metadata for EACH image in JSON format.

If analyzing a single image, return a single JSON object.
If analyzing multiple images, return an array of JSON objects, one for each image.

Each JSON object should have this structure:
{
  "title": "A clear, descriptive title for the image",
  "description": "A detailed description of what's in the image, its context, and notable elements",
  "keywords": ["array", "of", "relevant", "keywords", "minimum 45", "maximum 49"],
  "category": "MUST be exactly one of the following categories: ${categories.join(', ')}"
}

Requirements:
1. Response MUST be in valid JSON format
2. Category for each image MUST match exactly one from the provided list
3. Keywords should be specific and relevant, minimum 45, maximum 49 per image
4. Description should be 2-3 sentences per image
5. Title should be concise but descriptive, ideally no more than 10 words
6. When processing multiple images, maintain the same order in your response array as the input images`;
