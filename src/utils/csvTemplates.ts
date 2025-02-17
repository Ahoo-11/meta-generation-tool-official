
import { ImageMetadata } from '@/config/imageAnalysis';

export interface CSVTemplate {
  name: string;
  headers: string[];
  formatData: (metadata: ImageMetadata, fileName: string) => Record<string, string>;
}

// Adobe Stock Template
export const adobeStockTemplate: CSVTemplate = {
  name: "AdobeStock",
  headers: ["Filename", "Title", "Keywords", "Category", "Description"],
  formatData: (metadata, fileName) => ({
    Filename: fileName,
    Title: metadata.title,
    Keywords: metadata.keywords.join(';'),
    Category: metadata.category,
    Description: metadata.description
  })
};

// Freepik Template
export const freepikTemplate: CSVTemplate = {
  name: "Freepik",
  headers: ["file_name", "title", "tags", "description", "main_category"],
  formatData: (metadata, fileName) => ({
    file_name: fileName,
    title: metadata.title,
    tags: metadata.keywords.join(','),
    description: metadata.description,
    main_category: metadata.category
  })
};

// Template Registry
export const templates: CSVTemplate[] = [adobeStockTemplate, freepikTemplate];

export const getTemplate = (name: string): CSVTemplate | undefined => {
  return templates.find(t => t.name === name);
};
